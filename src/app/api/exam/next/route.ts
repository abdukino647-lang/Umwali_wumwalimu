import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateRotatingExam, ExamSeenState } from "@/lib/exam-builder";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  let incomingSeenState: Partial<ExamSeenState> | undefined;

  // Try parsing request body first
  try {
    const body = await req.json();
    if (body?.seenState) {
      incomingSeenState = body.seenState;
    }
  } catch {
    // Body is optional
  }

  // Fallback to cookie if body didn't provide it
  if (!incomingSeenState) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/exam_seen_state=([^;]+)/);
    if (match && match[1]) {
      try {
        incomingSeenState = JSON.parse(decodeURIComponent(match[1]));
      } catch {
        // Invalid cookie
      }
    }
  }

  const result = await generateRotatingExam(userId, incomingSeenState);

  const response = NextResponse.json({
    ok: true,
    questions: result.questions,
    seenState: result.seenState,
  });

  // Set the updated cookie so reloads or subsequent visits know the rotation progress
  const cookieVal = encodeURIComponent(JSON.stringify(result.seenState));
  response.cookies.set("exam_seen_state", cookieVal, {
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: "lax",
    httpOnly: false, // Allow client scripts to also read/sync if needed
  });

  return response;
}

export async function GET(req: Request) {
  return POST(req);
}
