import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { ilike, eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  let email = "";
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ success: false, message: "Ubusabe ntibwemewe." }, { status: 400 });
  }
  email = String(email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ success: false, message: "Shyiramo email yawe." }, { status: 400 });
  }

  // Use case-insensitive email lookup
  const user = (
    await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(ilike(users.email, email))
      .limit(1)
  )[0];

  // Informative feedback so the user knows in real-time if the email wasn't found
  if (!user) {
    return NextResponse.json({
      success: false,
      notFound: true,
      message: `Nta konti ifite iyi email twabonye (${email}). Reba neza ko wayanditse neza cyangwa ubanze wiyandikishe.`,
    }, { status: 404 });
  }

  // One active reset token per user at a time
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
  await db.insert(passwordResetTokens).values({ token, userId: user.id, expires });

  // Compute exact origin from the request to guarantee valid link across any domain
  const origin = new URL(req.url).origin;
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || origin;
  const link = `${base}/reset-password?token=${token}`;
  const relativeLink = `/reset-password?token=${token}`;

  const key =
    process.env.RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    process.env.AUTH_RESEND_KEY;

  let emailed = false;
  let emailError: string | null = null;

  if (key && key !== "re_123") {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(key);

      // Protect against unverified domain error: Resend rejects sending from .vercel.app
      let from = process.env.RESEND_FROM || "Amategeko <onboarding@resend.dev>";
      if (from.includes("vercel.app") || from.includes("example.com")) {
        from = "Amategeko <onboarding@resend.dev>";
      }
      const recipient = user.email || email;

      const result = await resend.emails.send({
        from,
        to: recipient,
        subject: "Gusubiramo ijambo ry'ibanga — Amategeko y'Umuhanda",
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background-color: #0b1928; color: #ecfeff; border-radius: 16px; border: 1px solid rgba(6, 182, 212, 0.2);">
          <h2 style="color: #38bdf8; margin-top: 0; font-size: 22px;">Gusubiramo Ijambo ry'Ibanga</h2>
          <p style="font-size: 15px; color: #cffafe; line-height: 1.6;">Muraho <strong>${user.name ?? "Mukunzi"}</strong>,</p>
          <p style="font-size: 14px; color: #a5f3fc; line-height: 1.6;">Wasabye guhindura ijambo ry'ibanga rya konti yawe ya <strong>Amategeko y'Umuhanda</strong>. Kanda kuri iyi buto ikurikira kugira ngo ushyireho ijambo ry'ibanga rishya:</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${link}" style="background: linear-gradient(to right, #06b6d4, #0284c7); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block;">Guhindura Ijambo ry'Ibanga</a>
          </div>
          <p style="font-size: 12px; color: #67e8f9; opacity: 0.8; line-height: 1.5;">Niba buto idakora, kanda cyangwa ukoporore iyi link muri browser yawe:<br /><a href="${link}" style="color: #38bdf8; word-break: break-all;">${link}</a></p>
          <hr style="border: none; border-top: 1px solid rgba(6, 182, 212, 0.2); margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Iyi link imara isaha 1 gusa. Niba atari wowe wabisabye, irengagize ubu butumwa, ijambo ryawe ry'ibanga ntirihinduka.</p>
        </div>`,
      });

      if (result?.error) {
        emailError = `${result.error.name ?? "error"}: ${result.error.message ?? ""}`;
      } else {
        emailed = true;
      }
    } catch (e) {
      emailError = e instanceof Error ? e.message : "send failed";
    }
  } else {
    emailError = "RESEND_API_KEY ntiri mu miterere ya sisitemu (environment variables).";
  }

  console.log(
    `[password-reset] for ${email}: ${link} | emailed=${emailed}${
      emailError ? ` | error=${emailError}` : ""
    }`
  );

  return NextResponse.json({
    success: true,
    emailed,
    emailError,
    resetLink: link,
    relativeResetLink: relativeLink,
    message: emailed
      ? `Twoherereje link yo guhindura ijambo ry'ibanga kuri email yawe (${email}). Kandi ushobora no gukanda buto iri hasi uhite uyihindura ako kanya mu gihe nyacyo!`
      : `Twakiriye ubusabe bwawe. Koresha iyi buto iri hasi uhite ushyiraho ijambo ry'ibanga rishya ako kanya utarindiriye:`,
  });
}
