import { ConsoleProvider } from "./console";
import { ResendProvider } from "./resend";

export interface EmailProvider {
  sendMagicLink(email: string, token: string, url: string): Promise<void>;
  sendScoringComplete(email: string, jobId: string, score: number): Promise<void>;
}

export function getEmailProvider(): EmailProvider {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
    return new ResendProvider(process.env.RESEND_API_KEY);
  }
  return new ConsoleProvider();
}
