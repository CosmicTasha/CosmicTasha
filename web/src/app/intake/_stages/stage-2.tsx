"use client";

import * as React from "react";
import {
  Cloud,
  Globe,
  Sailboat,
  Triangle,
  Droplets,
  Building,
  HelpCircle,
  Box,
  Layers,
  Zap,
  Shuffle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "../_components/question-card";
import { SelectCard } from "../_components/select-card";
import { ChipMultiSelect } from "../_components/chip-multi-select";
import { SegmentSelector } from "../_components/segment-selector";
import { cn } from "@/lib/utils";
import { InlineInsight } from "../_components/inline-insight";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Stage2Props {
  answers: Record<string, unknown>;
  onAnswer: (questionId: string, value: unknown) => void;
  onContinue?: () => void;
}

interface PipelineStep {
  status: string;
  skip_reason?: string;
}

interface EnvironmentEntry {
  name: string;
  isolated: string;
}

// ---------------------------------------------------------------------------
// Data — Q2.1 Providers
// ---------------------------------------------------------------------------

const PROVIDER_OPTIONS = [
  { id: "aws", title: "AWS", icon: <Cloud className="size-5" /> },
  { id: "gcp", title: "Google Cloud", icon: <Cloud className="size-5" /> },
  { id: "azure", title: "Microsoft Azure", icon: <Cloud className="size-5" /> },
  { id: "heroku", title: "Heroku", icon: <Sailboat className="size-5" /> },
  { id: "vercel-netlify", title: "Vercel / Netlify", icon: <Triangle className="size-5" /> },
  { id: "digitalocean", title: "DigitalOcean", icon: <Droplets className="size-5" /> },
  { id: "on-prem", title: "On-premises", icon: <Building className="size-5" /> },
  { id: "other", title: "Other", icon: <Globe className="size-5" /> },
] as const;

const AWS_SERVICES = ["EC2", "ECS/EKS", "Lambda", "RDS", "S3", "DynamoDB", "CloudFront", "SQS/SNS", "Other"];
const GCP_SERVICES = ["Compute Engine", "GKE", "Cloud Run", "Cloud SQL", "BigQuery", "Cloud Storage", "Other"];
const AZURE_SERVICES = ["App Service", "AKS", "Functions", "SQL Database", "Blob Storage", "Other"];

// ---------------------------------------------------------------------------
// Data — Q2.2 Architecture
// ---------------------------------------------------------------------------

const ARCH_OPTIONS = [
  { id: "monolith", title: "Monolith", description: "One main application", icon: <Box className="size-5" /> },
  { id: "microservices", title: "Microservices", description: "Multiple services communicating", icon: <Layers className="size-5" /> },
  { id: "serverless", title: "Serverless", description: "Functions and managed services", icon: <Zap className="size-5" /> },
  { id: "hybrid", title: "Hybrid", description: "Mix of the above", icon: <Shuffle className="size-5" /> },
  { id: "unsure", title: "I'm not sure", description: "That's fine \u2014 you might want to loop in an engineer", icon: <HelpCircle className="size-5" /> },
] as const;

// ---------------------------------------------------------------------------
// Data — Q2.3 SaaS categories
// ---------------------------------------------------------------------------

interface SaasCategory {
  key: string;
  label: string;
  options: string[];
  gapWarning?: boolean;
}

const SAAS_CATEGORIES: SaasCategory[] = [
  { key: "q2_3_identity", label: "Identity & Access", options: ["Okta", "Google Workspace", "Microsoft Entra ID", "JumpCloud", "OneLogin", "Auth0", "Other", "None"], gapWarning: true },
  { key: "q2_3_source_code", label: "Source Code", options: ["GitHub", "GitLab", "Bitbucket", "Azure DevOps", "Other"] },
  { key: "q2_3_cicd", label: "CI/CD", options: ["GitHub Actions", "GitLab CI", "CircleCI", "Jenkins", "ArgoCD", "Other", "None"] },
  { key: "q2_3_monitoring", label: "Monitoring", options: ["Datadog", "New Relic", "Splunk", "PagerDuty", "CloudWatch", "Sentry", "Other", "None"], gapWarning: true },
  { key: "q2_3_project", label: "Project Management", options: ["Jira", "Linear", "Asana", "Shortcut", "GitHub Issues", "Other"] },
  { key: "q2_3_communication", label: "Communication", options: ["Slack", "Microsoft Teams", "Discord", "Other"] },
  { key: "q2_3_hr", label: "HR", options: ["BambooHR", "Rippling", "Gusto", "Deel", "Other", "None"] },
  { key: "q2_3_endpoint", label: "Endpoint Management", options: ["Jamf", "Kandji", "Microsoft Intune", "Kolide", "Other", "None"], gapWarning: true },
];

// ---------------------------------------------------------------------------
// Data — Q2.4 Data types
// ---------------------------------------------------------------------------

interface DataTypeOption {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  note?: string;
}

const DATA_TYPE_OPTIONS: DataTypeOption[] = [
  { id: "pii", label: "PII (names, emails, addresses)", severity: "medium" },
  { id: "phi", label: "PHI (medical / health data)", severity: "high", note: "We'll flag HIPAA overlay requirements" },
  { id: "financial", label: "Financial data (bank, payments)", severity: "high", note: "Consider PCI DSS \u2014 we'll note this" },
  { id: "ip", label: "Intellectual property", severity: "medium" },
  { id: "auth", label: "Auth credentials (passwords, tokens)", severity: "high" },
  { id: "public", label: "Public data only", severity: "low" },
];

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-gray-500/15 text-gray-400",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-orange-500/15 text-orange-400",
};

// ---------------------------------------------------------------------------
// Data — Q2.5 Pipeline steps
// ---------------------------------------------------------------------------

const PIPELINE_STEPS = [
  "Code Review / PR",
  "Automated Tests",
  "Staging Environment",
  "Manual Approval",
  "Automated Deployment",
] as const;

const PIPELINE_TOGGLE_OPTIONS = ["Yes", "Sometimes", "No"];

// ---------------------------------------------------------------------------
// Data — Q2.6 Environments
// ---------------------------------------------------------------------------

const DEFAULT_ENVIRONMENTS = ["Development", "Staging / QA", "Production"];

const ISOLATION_OPTIONS = ["Yes", "No", "Partially"];

// ---------------------------------------------------------------------------
// Inline micro-components
// ---------------------------------------------------------------------------

function GapCallout({ category }: { category: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-2 rounded-lg border-l-4 border-[#F97316] bg-ct-surface px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#F97316]" />
        <p className="text-sm text-ct-text-secondary">
          <span className="font-medium text-ct-text-primary">Heads up</span> &mdash; most SOC 2
          auditors expect centralized {category.toLowerCase()}. We&apos;ll include this as a gap in
          your profile.
        </p>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={cn(
        "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        SEVERITY_STYLES[severity]
      )}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Stage2({ answers, onAnswer, onContinue }: Stage2Props) {
  // -- Q2.1 --
  const providers = (answers["q2_1"] as string[]) ?? [];
  const awsServices = (answers["q2_1a_aws"] as string[]) ?? [];
  const gcpServices = (answers["q2_1a_gcp"] as string[]) ?? [];
  const azureServices = (answers["q2_1a_azure"] as string[]) ?? [];
  const multiAccess = (answers["q2_1_multi_access"] as string) ?? "";

  // -- Q2.2 --
  const architecture = (answers["q2_2"] as string) ?? "";

  // -- Q2.3 (each category) --
  const saasSelections = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const cat of SAAS_CATEGORIES) {
      map[cat.key] = (answers[cat.key] as string[]) ?? [];
    }
    return map;
  }, [answers]);

  // -- Q2.4 --
  const dataTypes = (answers["q2_4"] as string[]) ?? [];

  // -- Q2.5 --
  const pipeline = (answers["q2_5"] as Record<string, PipelineStep>) ?? {};

  // -- Q2.6 --
  const environments = (answers["q2_6"] as EnvironmentEntry[]) ?? [];

  // -- helpers --

  const toggleProvider = (id: string) => {
    const next = providers.includes(id)
      ? providers.filter((p) => p !== id)
      : [...providers, id];
    onAnswer("q2_1", next);
  };

  const toggleDataType = (id: string) => {
    const next = dataTypes.includes(id)
      ? dataTypes.filter((d) => d !== id)
      : [...dataTypes, id];
    onAnswer("q2_4", next);
  };

  const updatePipeline = (step: string, field: "status" | "skip_reason", value: string) => {
    const current = pipeline[step] ?? { status: "" };
    onAnswer("q2_5", { ...pipeline, [step]: { ...current, [field]: value } });
  };

  const toggleEnvironment = (name: string) => {
    const exists = environments.find((e) => e.name === name);
    if (exists) {
      onAnswer("q2_6", environments.filter((e) => e.name !== name));
    } else {
      onAnswer("q2_6", [...environments, { name, isolated: "" }]);
    }
  };

  const updateIsolation = (name: string, isolated: string) => {
    onAnswer(
      "q2_6",
      environments.map((e) => (e.name === name ? { ...e, isolated } : e))
    );
  };

  const hasMultipleProviders =
    providers.filter((p) => !["other"].includes(p)).length >= 2;

  // -- continue logic --
  const hasSaasAnswers = SAAS_CATEGORIES.some(
    (cat) => (saasSelections[cat.key]?.length ?? 0) > 0
  );
  const hasPipelineAnswers = Object.keys(pipeline).length > 0;

  const canContinue =
    providers.length > 0 &&
    architecture.length > 0 &&
    hasSaasAnswers &&
    dataTypes.length > 0 &&
    hasPipelineAnswers;

  // -- custom env text --
  const [customEnvText, setCustomEnvText] = React.useState("");

  return (
    <div className="flex flex-col gap-10">
      {/* ================================================================= */}
      {/* Q2.1 — Where does your application run? */}
      {/* ================================================================= */}
      <QuestionCard id="q2_1" label="Where does your application run?" required>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
          {PROVIDER_OPTIONS.map((opt) => (
            <SelectCard
              key={opt.id}
              icon={opt.icon}
              title={opt.title}
              selected={providers.includes(opt.id)}
              onClick={() => toggleProvider(opt.id)}
              className="w-full"
            />
          ))}
        </div>

        {/* AWS sub-question */}
        {providers.includes("aws") && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-4">
            <p className="mb-2 text-sm font-medium text-ct-text-secondary">
              Which AWS services?
            </p>
            <ChipMultiSelect
              options={AWS_SERVICES}
              selected={awsServices}
              onChange={(val) => onAnswer("q2_1a_aws", val)}
            />
          </div>
        )}

        {/* GCP sub-question */}
        {providers.includes("gcp") && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-4">
            <p className="mb-2 text-sm font-medium text-ct-text-secondary">
              Which GCP services?
            </p>
            <ChipMultiSelect
              options={GCP_SERVICES}
              selected={gcpServices}
              onChange={(val) => onAnswer("q2_1a_gcp", val)}
            />
          </div>
        )}

        {/* Azure sub-question */}
        {providers.includes("azure") && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-4">
            <p className="mb-2 text-sm font-medium text-ct-text-secondary">
              Which Azure services?
            </p>
            <ChipMultiSelect
              options={AZURE_SERVICES}
              selected={azureServices}
              onChange={(val) => onAnswer("q2_1a_azure", val)}
            />
          </div>
        )}

        {/* On-premises note */}
        {providers.includes("on-prem") && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-4">
            <p className="text-sm italic text-ct-text-secondary">
              We&apos;ll ask about physical security later.
            </p>
          </div>
        )}

        {/* Multi-provider access question */}
        {hasMultipleProviders && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-4">
            <p className="mb-2 text-sm font-medium text-ct-text-secondary">
              How do you manage access across cloud providers?
            </p>
            <Textarea
              value={multiAccess}
              onChange={(e) => onAnswer("q2_1_multi_access", e.target.value)}
              placeholder="e.g., centralized SSO, separate IAM per provider, Terraform..."
              rows={3}
              className="max-w-lg border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary"
            />
          </div>
        )}
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q2.2 — Architecture */}
      {/* ================================================================= */}
      <QuestionCard id="q2_2" label="What does your architecture look like?" required>
        <div className="flex flex-col gap-3 max-w-lg">
          {ARCH_OPTIONS.map((opt) => (
            <SelectCard
              key={opt.id}
              icon={opt.icon}
              title={opt.id === "unsure" ? opt.title : opt.title}
              description={opt.description}
              selected={architecture === opt.id}
              onClick={() => onAnswer("q2_2", opt.id)}
              className={cn("w-full", opt.id === "unsure" && "italic")}
            />
          ))}
        </div>
      </QuestionCard>

      {/* Invite hint after architecture question */}
      {architecture === "unsure" && (
        <p className="text-xs text-ct-text-tertiary -mt-4">
          Tip: You can{" "}
          <span className="text-ct-accent">invite a teammate</span> to fill in
          this section using the sidebar.
        </p>
      )}

      {/* ================================================================= */}
      {/* Q2.3 — SaaS tools by category */}
      {/* ================================================================= */}
      <QuestionCard
        id="q2_3"
        label="What key SaaS tools does your team use?"
        required
      >
        <div className="flex flex-col gap-6">
          {SAAS_CATEGORIES.map((cat) => {
            const selected = saasSelections[cat.key] ?? [];
            const showGap =
              cat.gapWarning && selected.includes("None");

            return (
              <div key={cat.key} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ct-text-secondary">
                  {cat.label}
                </p>
                <ChipMultiSelect
                  options={cat.options}
                  selected={selected}
                  onChange={(val) => onAnswer(cat.key, val)}
                />
                {showGap && <GapCallout category={cat.label} />}
                {showGap && cat.key === "q2_3_identity" && (
                  <InlineInsight
                    type="gap"
                    title="No Centralized Identity Provider"
                    description="Without a centralized identity provider, user access is harder to manage and audit across systems."
                  />
                )}
                {showGap && cat.key === "q2_3_monitoring" && (
                  <InlineInsight
                    type="gap"
                    title="No Centralized Monitoring"
                    description="Lack of centralized monitoring makes it difficult to detect incidents and maintain visibility into system health."
                  />
                )}
                {showGap && cat.key === "q2_3_endpoint" && (
                  <InlineInsight
                    type="gap"
                    title="No Endpoint Management"
                    description="Without endpoint management, device security and compliance cannot be enforced consistently."
                  />
                )}
              </div>
            );
          })}
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q2.4 — Data types */}
      {/* ================================================================= */}
      <QuestionCard
        id="q2_4"
        label="What types of data does your application handle?"
        required
      >
        <div className="flex flex-col gap-2 max-w-lg">
          {DATA_TYPE_OPTIONS.map((opt) => {
            const isSelected = dataTypes.includes(opt.id);
            return (
              <div key={opt.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleDataType(opt.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    "bg-ct-surface hover:bg-ct-surface-raised",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ct-accent/50",
                    isSelected
                      ? "border-ct-accent shadow-[0_0_0_1px_var(--ct-accent)]"
                      : "border-ct-border-subtle hover:border-ct-border-default"
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "transition-colors duration-200",
                      isSelected ? "text-ct-text-primary" : "text-ct-text-secondary"
                    )}
                  >
                    {opt.label}
                  </span>
                  <SeverityBadge severity={opt.severity} />
                </button>
                {isSelected && opt.note && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-2 ml-4">
                    <p className="text-sm italic text-ct-text-secondary">
                      {opt.note}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q2.5 — Pipeline */}
      {/* ================================================================= */}
      <QuestionCard
        id="q2_5"
        label="How does code get from a developer's laptop to production?"
        required
      >
        <p className="text-sm italic text-ct-text-tertiary -mt-1 mb-3">
          Be honest about what actually happens on a Friday afternoon deploy, not
          just the ideal process.
        </p>
        <div className="flex flex-col gap-4 max-w-lg">
          {PIPELINE_STEPS.map((step) => {
            const entry = pipeline[step] ?? { status: "" };
            return (
              <div
                key={step}
                className="flex flex-col gap-2 rounded-xl border border-ct-border-subtle bg-ct-surface p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-ct-text-primary">
                    {step}
                  </span>
                  <SegmentSelector
                    options={PIPELINE_TOGGLE_OPTIONS}
                    value={entry.status || null}
                    onChange={(val) => updatePipeline(step, "status", val)}
                  />
                </div>
                {entry.status === "Sometimes" && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      value={entry.skip_reason ?? ""}
                      onChange={(e) =>
                        updatePipeline(step, "skip_reason", e.target.value)
                      }
                      placeholder="When does it get skipped?"
                      className="border-ct-border-subtle bg-ct-surface-raised text-ct-text-primary placeholder:text-ct-text-tertiary text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {pipeline["Code Review / PR"]?.status === "Yes" &&
            pipeline["Automated Tests"]?.status === "Yes" && (
              <InlineInsight
                type="strength"
                title="Strong CI/CD Pipeline"
                description="Code reviews and automated tests are in place, reducing the risk of undetected defects reaching production."
              />
            )}
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Q2.6 — Environments (optional) */}
      {/* ================================================================= */}
      <QuestionCard
        id="q2_6"
        label="How many environments do you maintain?"
        description="Optional \u2014 helps us understand your deployment topology"
      >
        <div className="flex flex-col gap-3 max-w-lg">
          {DEFAULT_ENVIRONMENTS.map((envName) => {
            const entry = environments.find((e) => e.name === envName);
            const isChecked = Boolean(entry);
            return (
              <div key={envName} className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleEnvironment(envName)}
                    className="size-4 rounded border-ct-border-subtle accent-[var(--ct-accent)]"
                  />
                  <span className="text-sm font-medium text-ct-text-primary">
                    {envName}
                  </span>
                </label>
                {isChecked && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200 ml-7 flex items-center gap-3">
                    <span className="text-sm text-ct-text-secondary whitespace-nowrap">
                      Isolated from others?
                    </span>
                    <SegmentSelector
                      options={ISOLATION_OPTIONS}
                      value={entry?.isolated || null}
                      onChange={(val) => updateIsolation(envName, val)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom "Other" environment */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={environments.some(
                    (e) => !DEFAULT_ENVIRONMENTS.includes(e.name)
                  )}
                  onChange={() => {
                    const custom = environments.find(
                      (e) => !DEFAULT_ENVIRONMENTS.includes(e.name)
                    );
                    if (custom) {
                      onAnswer(
                        "q2_6",
                        environments.filter(
                          (e) => DEFAULT_ENVIRONMENTS.includes(e.name)
                        )
                      );
                      setCustomEnvText("");
                    } else {
                      onAnswer("q2_6", [
                        ...environments,
                        { name: customEnvText || "Other", isolated: "" },
                      ]);
                    }
                  }}
                  className="size-4 rounded border-ct-border-subtle accent-[var(--ct-accent)]"
                />
                <span className="text-sm font-medium text-ct-text-primary">
                  Other
                </span>
              </label>
              {environments.some(
                (e) => !DEFAULT_ENVIRONMENTS.includes(e.name)
              ) && (
                <Input
                  value={customEnvText}
                  onChange={(e) => {
                    setCustomEnvText(e.target.value);
                  }}
                  onBlur={() => {
                    if (customEnvText.trim()) {
                      onAnswer(
                        "q2_6",
                        environments.map((env) =>
                          DEFAULT_ENVIRONMENTS.includes(env.name)
                            ? env
                            : { ...env, name: customEnvText.trim() }
                        )
                      );
                    }
                  }}
                  placeholder="Environment name"
                  className="max-w-[200px] border-ct-border-subtle bg-ct-surface text-ct-text-primary placeholder:text-ct-text-tertiary text-sm"
                />
              )}
            </div>
            {environments.some(
              (e) => !DEFAULT_ENVIRONMENTS.includes(e.name)
            ) && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 ml-7 flex items-center gap-3">
                <span className="text-sm text-ct-text-secondary whitespace-nowrap">
                  Isolated from others?
                </span>
                <SegmentSelector
                  options={ISOLATION_OPTIONS}
                  value={
                    environments.find(
                      (e) => !DEFAULT_ENVIRONMENTS.includes(e.name)
                    )?.isolated || null
                  }
                  onChange={(val) => {
                    const custom = environments.find(
                      (e) => !DEFAULT_ENVIRONMENTS.includes(e.name)
                    );
                    if (custom) updateIsolation(custom.name, val);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </QuestionCard>

      {/* ================================================================= */}
      {/* Continue */}
      {/* ================================================================= */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          canContinue
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          className="h-10 gap-2 rounded-xl bg-ct-accent px-6 text-sm font-medium text-white hover:bg-ct-accent/90"
        >
          Continue to Organizational Structure
          <span aria-hidden="true">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}
