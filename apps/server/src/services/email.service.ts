import { Resend } from "resend";

let resend: Resend;

function getClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const from = process.env.EMAIL_FROM ?? "Snap Cals <noreply@snapcals.com>";

export async function sendVerificationCode(email: string, code: string) {
  await getClient().emails.send({
    from,
    to: email,
    subject: "Snap Cals — Verify your email",
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
}

export async function sendPasswordResetCode(email: string, code: string) {
  await getClient().emails.send({
    from,
    to: email,
    subject: "Snap Cals — Reset your password",
    html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
}
