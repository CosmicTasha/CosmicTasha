type EventName =
  | "intake_started"
  | "stage_completed"
  | "question_answered"
  | "question_skipped"
  | "collaborator_invited"
  | "intake_completed"
  | "intake_abandoned"
  | "profile_viewed"
  | "profile_downloaded"
  | "profile_shared"
  | "doc_generation_started"
  | "upgrade_clicked"
  | "magic_link_requested"
  | "session_resumed"
  | "tier_changed";

interface EventProperties {
  [key: string]: string | number | boolean | null;
}

export function track(event: EventName, properties?: EventProperties): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, properties || {});
  }

  // Future: send to analytics service
  // posthog.capture(event, properties);
  // mixpanel.track(event, properties);
}

export function identify(
  userId: string,
  traits?: Record<string, string>,
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] identify`, { userId, ...traits });
  }
}

export function page(name: string, properties?: EventProperties): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] page`, { name, ...properties });
  }
}
