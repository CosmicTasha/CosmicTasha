import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-ct-text-primary">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-ct-text-tertiary">
        Last updated: April 2026
      </p>
      <p className="mt-4 rounded-lg border border-ct-border-subtle bg-ct-surface p-4 text-sm text-ct-text-secondary">
        <strong>Draft notice:</strong> This is a placeholder. This policy is
        not legal advice and has not been reviewed by counsel.
      </p>

      <section className="mt-12 space-y-10 text-sm leading-relaxed text-ct-text-secondary">
        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            1. Information We Collect
          </h2>
          <p className="mt-2">
            We collect information you provide during the intake process,
            including company details, technical environment descriptions, and
            security assessment responses. We also collect basic usage data
            such as pages visited and feature interactions.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            2. How We Use Your Information
          </h2>
          <p className="mt-2">
            Your information is used to generate compliance documents, perform
            gap analysis, and calculate readiness scores. We use aggregated,
            anonymized data to improve our AI models and service quality. We do
            not sell your personal information to third parties.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            3. Data Storage &amp; Security
          </h2>
          <p className="mt-2">
            CosmicTasha uses a local-first AI architecture wherever possible,
            meaning your data is processed on your infrastructure. All data is
            encrypted at rest and in transit. Paid customers receive isolated,
            per-tenant database schemas for additional security.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            4. Data Retention
          </h2>
          <p className="mt-2">
            Discovery (free) tier data is retained for 72 hours after your
            last session, then automatically purged. Paid plan data is retained
            for 12 months after account closure, or until you request deletion,
            whichever comes first. You may request immediate deletion at any
            time.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            5. Your Rights
          </h2>
          <p className="mt-2">
            You have the right to request deletion of your data, export your
            data in a portable format, and correct any inaccurate information.
            To exercise these rights, contact us at the email below. We will
            respond to all requests within 30 days.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            6. Subprocessors
          </h2>
          <p className="mt-2">
            We use the following subprocessors to provide the service:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Cloud hosting provider (infrastructure)</li>
            <li>Payment processor (billing)</li>
            <li>Email service provider (transactional emails)</li>
          </ul>
          <p className="mt-2">
            A complete, up-to-date subprocessor list is available upon request.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ct-text-primary">
            7. Contact
          </h2>
          <p className="mt-2">
            For privacy-related inquiries, contact us at{" "}
            <a
              href="mailto:privacy@cosmictasha.com"
              className="text-ct-accent hover:underline"
            >
              privacy@cosmictasha.com
            </a>
            .
          </p>
        </div>
      </section>

      <div className="mt-16">
        <Link
          href="/"
          className="text-sm text-ct-accent hover:underline"
        >
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
