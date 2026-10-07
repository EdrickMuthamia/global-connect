import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAdminPaymentAlert({
  memberName,
  memberEmail,
  reference,
  amountKes,
  method,
  note,
}: {
  memberName: string;
  memberEmail: string;
  reference: string;
  amountKes: string;
  method: string;
  note?: string | null;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  await transporter.sendMail({
    from: `"Global Connect" <${process.env.SMTP_USER}>`,
    to: "edrickmuthamia14@gmail.com",
    subject: `💰 New Payment Received — ${memberName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#1e40af;padding:24px 28px">
          <h2 style="color:#fff;margin:0;font-size:20px">New Payment Submission</h2>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Global Connect Admin Alert</p>
        </div>
        <div style="padding:28px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#64748b;width:140px">Member</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${memberName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0;color:#0f172a">${memberEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">M-Pesa Ref</td><td style="padding:8px 0;font-weight:700;color:#1e40af;font-family:monospace">${reference}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Amount</td><td style="padding:8px 0;font-weight:700;color:#16a34a">KSh ${amountKes}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Method</td><td style="padding:8px 0;color:#0f172a">${method.replace(/_/g, " ")}</td></tr>
            ${note ? `<tr><td style="padding:8px 0;color:#64748b">Note</td><td style="padding:8px 0;color:#0f172a;font-style:italic">${note}</td></tr>` : ""}
          </table>
          <div style="margin-top:24px">
            <a href="https://global-connect-ivory.vercel.app/admin?tab=payments" style="background:#1e40af;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Review Payment →
            </a>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#94a3b8">Submitted at ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT</p>
        </div>
      </div>
    `,
  });
}
