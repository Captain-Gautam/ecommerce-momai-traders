import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "465");
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "Momai Traders";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
};

export async function sendMail({
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: MailInput): Promise<boolean> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !to) {
    console.warn("[mail] SMTP not configured — email not sent.");
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: `"${SMTP_FROM}" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      replyTo,
      attachments,
    });
    return true;
  } catch (error) {
    console.error("[mail] Failed to send email:", error);
    return false;
  }
}
