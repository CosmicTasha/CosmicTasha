import type { EmailProvider } from "./provider";
import { log } from "@/lib/logger";

export class ConsoleProvider implements EmailProvider {
  async sendMagicLink(email: string, _token: string, url: string): Promise<void> {
    log.info({ email: "[redacted]", url }, "Magic link generated (console mode)");
  }

  async sendScoringComplete(email: string, jobId: string, score: number): Promise<void> {
    log.info({ email: "[redacted]", jobId, score }, "Scoring complete (console mode)");
  }
}
