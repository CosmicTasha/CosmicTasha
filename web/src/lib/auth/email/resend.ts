import { Resend } from "resend";
import type { EmailProvider } from "./provider";
import { log } from "@/lib/logger";

export class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendMagicLink(email: string, _token: string, url: string): Promise<void> {
    await this.client.emails.send({
      from: "DriftWatch <noreply@driftwatch.dev>",
      to: email,
      subject: "Your DriftWatch login link",
      html: `<p>Click below to sign in:</p><p><a href="${url}">Sign in to DriftWatch</a></p><p>This link expires in 15 minutes.</p>`,
    });
    log.info("Magic link email sent via Resend");
  }

  async sendScoringComplete(email: string, jobId: string, score: number): Promise<void> {
    await this.client.emails.send({
      from: "DriftWatch <noreply@driftwatch.dev>",
      to: email,
      subject: "Your DriftWatch readiness score is ready",
      html: `<p>Your readiness score: <strong>${score}/100</strong></p><p><a href="${process.env.BASE_URL}/intake/results?job=${jobId}">View Full Results</a></p>`,
    });
    log.info({ jobId, score }, "Scoring complete email sent via Resend");
  }
}
