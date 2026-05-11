import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing. Start free, scale as you grow.",
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Data                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

interface PricingTier {
  name: string;
  monthlyPrice: string;
  annualPrice: string | null;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  ctaStyle: "accent" | "outline" | "disabled";
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Discovery",
    monthlyPrice: "Free",
    annualPrice: null,
    description:
      "See where you stand. Complete a 30-minute intake and get a readiness score, P0 gap summary, and remediation roadmap.",
    features: [
      "Readiness score",
      "P0 gap summary",
      "5-minute assessment",
      "Save & resume progress",
    ],
    cta: "Current Plan",
    ctaHref: "#",
    ctaStyle: "disabled",
  },
  {
    name: "Starter",
    monthlyPrice: "$149",
    annualPrice: "$1,490/yr",
    description:
      "Full gap analysis and compliance document generation. You review and approve every section before it's finalized.",
    features: [
      "Full gap analysis",
      "14 compliance documents",
      "You review & approve every document",
      "PDF & DOCX export",
      "Email support",
    ],
    cta: "Get Started",
    ctaHref: "/intake",
    ctaStyle: "accent",
    popular: true,
  },
  {
    name: "Growth",
    monthlyPrice: "$349",
    annualPrice: "$3,490/yr",
    description:
      "Multi-framework compliance with cross-framework interaction scoring and priority support.",
    features: [
      "Everything in Starter",
      "Multi-framework (ISO 27001, HIPAA)",
      "Cross-framework gap interaction analysis",
      "Priority support",
      "Quarterly score tracking",
    ],
    cta: "Get Started",
    ctaHref: "/intake",
    ctaStyle: "accent",
  },
  {
    name: "Enterprise",
    monthlyPrice: "$999",
    annualPrice: "$9,990/yr",
    description:
      "Dedicated success management, SSO, and SLA guarantees for large organizations.",
    features: [
      "Everything in Growth",
      "SAML SSO & SCIM provisioning",
      "Dedicated success manager",
      "Custom document templates",
      "SLA guarantee",
      "On-call support",
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:sales@cosmictasha.com",
    ctaStyle: "outline",
  },
  {
    name: "Consultant",
    monthlyPrice: "$599",
    annualPrice: "$5,990/yr",
    description:
      "Multi-client workspace with white-label reports and delegated intake.",
    features: [
      "Up to 10 clients ($49/additional)",
      "Template library",
      "Client intake delegation",
      "White-label reports",
      "Billing dashboard",
    ],
    cta: "Apply for Access",
    ctaHref: "mailto:partners@cosmictasha.com",
    ctaStyle: "outline",
  },
];

const allPlansInclude = [
  "No third-party AI providers",
  "SOC 2 compliance engine",
  "Encrypted data at rest & transit",
  "No vendor lock-in",
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes, upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle, and we prorate the difference.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "You retain read-only access to documents generated on your previous plan. You can export or delete your data at any time — it's yours. The only thing we keep are our own model weights, which never contain your data.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes, save 17% with annual billing on any paid plan. Annual subscriptions are billed upfront for the full year.",
  },
  {
    q: "How is your readiness score different from other tools?",
    a: "Most compliance platforms score each dimension independently and average the results. Two companies with the same average can have radically different audit outcomes because their gaps interact — a documentation weakness can mask a control failure, and an access control gap can cascade into a data protection exposure. Our scoring engine models these interactions so your score reflects what an auditor will actually find, not a checklist average.",
  },
  {
    q: "How does the free Discovery plan work?",
    a: "Complete the 30-minute intake questionnaire. Your readiness score and P0 gap summary are typically ready within an hour, though it can take up to two hours during peak demand. No credit card required.",
  },
  {
    q: "Who reviews the generated documents?",
    a: "You do. DriftWatch generates compliance documents from your intake data, but every section requires your explicit approval before it's finalized. No DriftWatch employee ever sees your answers or reviews your documents. When your auditor asks how the documents were prepared, the answer is: your team reviewed and approved every section through a tracked review gate.",
  },
  {
    q: "Is my data safe?",
    a: "Your intake data and generated documents are processed by AI models running on DriftWatch infrastructure — never forwarded to third-party AI APIs. All data is encrypted at rest and in transit. You can delete your data at any time, and we honor deletion requests within 72 hours.",
  },
  {
    q: "Do I need to talk to sales first?",
    a: "No. Start your assessment right now — no demo, no sales call, no waiting for access. You'll see your readiness score and gap analysis before you ever talk to us. If you want help interpreting results or choosing a plan, we're here, but the product speaks for itself.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, 30-day money-back guarantee on all paid plans. No questions asked.",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Components                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function PricingCard({ tier }: { tier: PricingTier }) {
  const button = (() => {
    const base =
      "mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors";

    if (tier.ctaStyle === "disabled") {
      return (
        <span
          className={`${base} cursor-default bg-ct-surface-raised text-ct-text-tertiary`}
        >
          {tier.cta}
        </span>
      );
    }

    if (tier.ctaStyle === "outline") {
      return (
        <Link
          href={tier.ctaHref}
          className={`${base} border border-ct-border-default text-ct-text-primary hover:bg-ct-surface-raised`}
        >
          {tier.cta}
        </Link>
      );
    }

    // accent
    return (
      <Link
        href={tier.ctaHref}
        className={`${base} bg-ct-accent text-white hover:opacity-90`}
      >
        {tier.cta}
      </Link>
    );
  })();

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        tier.popular
          ? "border-ct-accent bg-ct-surface"
          : "border-ct-border-subtle bg-ct-surface"
      }`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ct-accent px-4 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}

      {/* Tier name */}
      <h3 className="text-lg font-semibold text-ct-text-primary">
        {tier.name}
      </h3>

      {/* Price */}
      <div className="mt-4">
        <span className="text-4xl font-bold text-ct-text-primary">
          {tier.monthlyPrice}
        </span>
        {tier.monthlyPrice !== "Free" && (
          <span className="text-ct-text-secondary">/mo</span>
        )}
      </div>
      {tier.annualPrice && (
        <p className="mt-1 text-sm text-ct-status-strength">
          {tier.annualPrice} — save 17%
        </p>
      )}

      {/* Description */}
      <p className="mt-4 text-sm leading-relaxed text-ct-text-secondary">
        {tier.description}
      </p>

      {/* Features */}
      <ul className="mt-6 flex-grow space-y-3">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-ct-text-secondary"
          >
            <span className="mt-0.5 text-ct-status-strength">&#10003;</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {button}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-ct-base text-ct-text-primary">
      {/* ── Header ── */}
      <section className="flex flex-col items-center px-6 pb-12 pt-32 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 max-w-lg text-lg text-ct-text-secondary">
          Start free, scale as you grow. No hidden fees.
        </p>
      </section>

      {/* ── Billing toggle (static) ── */}
      <div className="flex items-center justify-center gap-3 pb-12 text-sm">
        <span className="font-medium text-ct-text-primary">Monthly</span>
        <span className="text-ct-text-tertiary">/</span>
        <span className="font-medium text-ct-text-secondary">
          Annual{" "}
          <span className="text-ct-status-strength">(save 17%)</span>
        </span>
      </div>

      {/* ── Pricing Cards ── */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </section>

      {/* ── All Plans Include ── */}
      <section className="border-t border-ct-border-subtle bg-ct-surface px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">
          All plans include
        </h2>
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {allPlansInclude.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="mt-0.5 text-lg text-ct-accent">&#10003;</span>
              <span className="text-sm text-ct-text-secondary">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-12 text-center text-2xl font-bold">
          Frequently asked questions
        </h2>
        <div className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-base font-semibold text-ct-text-primary">
                {faq.q}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ct-text-secondary">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="border-t border-ct-border-subtle bg-ct-surface px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">Still have questions?</h2>
        <p className="mt-3 text-ct-text-secondary">
          Talk to our team or jump right in with a free assessment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="mailto:hello@cosmictasha.com"
            className="rounded-lg border border-ct-border-default px-6 py-3 text-sm font-semibold text-ct-text-primary transition-colors hover:bg-ct-surface-raised"
          >
            Contact Us
          </Link>
          <Link
            href="/intake"
            className="rounded-lg bg-ct-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            Start Free Assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
