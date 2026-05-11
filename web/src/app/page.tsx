import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Answer Questions",
    description:
      "30-minute guided intake about your company, tech stack, and security practices.",
  },
  {
    number: "2",
    title: "Get Your Profile",
    description:
      "Readiness score that models how your compliance dimensions interact — not just a checklist average. Plus gap analysis and remediation roadmap.",
  },
  {
    number: "3",
    title: "Generate Documents",
    description:
      "14 compliance-ready policies tailored to your exact setup.",
  },
];

const trustCards = [
  {
    title: "Interaction-Aware Scoring",
    description:
      "Checklist tools score each dimension independently. Our engine models how gaps compound — a documentation weakness that masks a control failure shows up here, not in your audit. Algorithm is MIT-licensed via ScoreRift.",
  },
  {
    title: "Your Data, Our Models",
    description:
      "AI inference runs on DriftWatch infrastructure — your data is never sent to third-party AI providers. Delete your data anytime.",
  },
  {
    title: "We Eat Our Own Cooking",
    description:
      "CosmicTasha runs its own SOC 2 assessment against this infrastructure.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ct-base text-ct-text-primary">
      {/* ── Hero ── */}
      <section className="flex flex-col items-center px-6 pb-24 pt-32 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-ct-accent">
          CosmicTasha
        </h1>
        <p className="mt-5 max-w-2xl text-xl leading-relaxed text-ct-text-secondary">
          Compliance tools show you gaps. We show you how your gaps
          interact&nbsp;&mdash; so you know what will actually fail the audit.
        </p>
        <Link
          href="/intake"
          className="mt-10 inline-flex items-center gap-2 rounded-lg bg-ct-accent px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start Your Assessment
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <p className="mt-4 text-sm text-ct-text-tertiary">
          No credit card, no sales call, no demo gate. Start now.
        </p>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            How It Works
          </h2>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ct-accent text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ct-text-secondary">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why CosmicTasha ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Why CosmicTasha
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {trustCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-ct-surface p-8"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-ct-text-secondary">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Simple Pricing
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 sm:mx-auto sm:max-w-3xl">
            {/* Discovery */}
            <div className="rounded-xl bg-ct-surface p-8">
              <h3 className="text-lg font-semibold">Discovery</h3>
              <p className="mt-1 text-3xl font-bold text-ct-status-strength">
                Free
              </p>
              <ul className="mt-6 space-y-3 text-ct-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-ct-status-strength">&bull;</span>
                  Guided intake questionnaire
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-ct-status-strength">&bull;</span>
                  Readiness score &amp; gap analysis
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-ct-status-strength">&bull;</span>
                  Remediation roadmap
                </li>
              </ul>
            </div>

            {/* Starter */}
            <div className="rounded-xl border border-ct-accent/30 bg-ct-surface p-8">
              <h3 className="text-lg font-semibold">Starter</h3>
              <p className="mt-1">
                <span className="text-3xl font-bold text-ct-accent">$149</span>
                <span className="text-ct-text-tertiary">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-ct-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-ct-accent">&bull;</span>
                  Everything in Discovery
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-ct-accent">&bull;</span>
                  14 compliance-ready policy documents
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-ct-accent">&bull;</span>
                  You review &amp; approve every document
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/pricing"
              className="text-sm font-medium text-ct-accent transition-opacity hover:opacity-80"
            >
              See All Plans &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="px-6 pb-32 pt-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Ready to build your compliance profile?
        </h2>
        <Link
          href="/intake"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-ct-accent px-10 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start Your Assessment
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>
    </main>
  );
}
