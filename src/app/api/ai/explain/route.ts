import { NextResponse } from 'next/server';
import { getTrafficLawExplanation, ExplanationRequest } from '@/lib/traffic-law-explainer';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const requestData: ExplanationRequest = {
      questionId: body.questionId,
      questionNumber: body.questionNumber,
      questionText: body.questionText || body.prompt || "",
      category: body.category,
      options: Array.isArray(body.options) ? body.options : [],
      correctKey: body.correctKey || body.correctAnswer || "d",
      correctText: body.correctText || body.correctAnswer || "",
      userKey: body.userKey || null,
      userText: body.userText || null,
    };

    const explanation = await getTrafficLawExplanation(requestData);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain route error:", error);
    return NextResponse.json(
      {
        explanation:
          "### [WARN] Ibisobanuro by'Itegeko\n\nNtabwo byashobotse kubona ubusobanuro muri aka kanya. Ongera ugerageze mukanya.",
      },
      { status: 200 }
    );
  }
}
