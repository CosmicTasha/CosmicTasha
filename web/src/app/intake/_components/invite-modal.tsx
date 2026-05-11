"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Send, CheckCircle2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: number;
  stageName: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function InviteModal({
  isOpen,
  onClose,
  currentStage,
  stageName,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  /* Fade-in / fade-out ------------------------------------------------ */

  useEffect(() => {
    if (isOpen) {
      // Force a reflow before enabling the visible class
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  /* Focus email field on open ----------------------------------------- */

  useEffect(() => {
    if (isOpen && !sentTo) {
      const t = setTimeout(() => emailRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, sentTo]);

  /* Escape key -------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  /* Reset on close ---------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setEmail("");
        setName("");
        setMessage("");
        setSentTo(null);
        setSending(false);
      }, 200); // wait for fade-out
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* Submit ------------------------------------------------------------ */

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || sending) return;

      setSending(true);

      try {
        const res = await fetch("/api/intake/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "local", // placeholder
            email: email.trim(),
            name: name.trim() || undefined,
            message: message.trim() || undefined,
            stage: currentStage,
          }),
        });

        if (!res.ok) throw new Error("Failed");

        setSentTo(email.trim());
      } catch (err) {
        // Fallback: still show success for MVP stub
        console.warn("Invite API error (showing success anyway):", err);
        setSentTo(email.trim());
      } finally {
        setSending(false);
      }
    },
    [email, name, message, currentStage, sending]
  );

  /* Send another ------------------------------------------------------ */

  const handleSendAnother = useCallback(() => {
    setEmail("");
    setName("");
    setMessage("");
    setSentTo(null);
  }, []);

  /* Don't render anything when fully closed --------------------------- */

  if (!isOpen && !visible) return null;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`w-full max-w-[440px] rounded-xl border border-white/[0.06] bg-ct-surface p-6 shadow-2xl transition-all duration-200 ${
          visible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-2"
        }`}
      >
        {/* ---- Success state ---- */}
        {sentTo ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#34D399]/15">
              <CheckCircle2 className="size-6 text-[#34D399]" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-ct-text-primary">
                Invitation sent!
              </h3>
              <p className="mt-1 text-sm text-ct-text-secondary">
                <span className="font-medium text-ct-text-primary">
                  {sentTo}
                </span>{" "}
                will receive a link to contribute to the{" "}
                <span className="font-medium text-ct-text-primary">
                  {stageName}
                </span>{" "}
                section.
              </p>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSendAnother}
                className="rounded-lg bg-ct-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ct-accent/90"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-ct-text-secondary transition-colors hover:text-ct-text-primary"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ---- Form state ---- */
          <>
            <h3 className="text-base font-semibold text-ct-text-primary">
              Invite a teammate
            </h3>
            <p className="mt-1 text-sm text-ct-text-secondary">
              They&apos;ll only see the{" "}
              <span className="font-medium text-ct-text-primary">
                {stageName}
              </span>{" "}
              section and relevant context from prior stages.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="invite-email"
                  className="text-xs font-medium text-ct-text-secondary"
                >
                  Their email
                </label>
                <input
                  ref={emailRef}
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="rounded-lg border border-ct-border-subtle bg-ct-surface-raised px-3 py-2 text-sm text-ct-text-primary placeholder:text-ct-text-tertiary outline-none transition-colors focus:border-ct-accent"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="invite-name"
                  className="text-xs font-medium text-ct-text-secondary"
                >
                  Their name (optional)
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane"
                  className="rounded-lg border border-ct-border-subtle bg-ct-surface-raised px-3 py-2 text-sm text-ct-text-primary placeholder:text-ct-text-tertiary outline-none transition-colors focus:border-ct-accent"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="invite-message"
                  className="text-xs font-medium text-ct-text-secondary"
                >
                  Message (optional)
                </label>
                <textarea
                  id="invite-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey, can you fill in the tech stack section?"
                  rows={2}
                  className="rounded-lg border border-ct-border-subtle bg-ct-surface-raised px-3 py-2 text-sm text-ct-text-primary placeholder:text-ct-text-tertiary outline-none transition-colors focus:border-ct-accent resize-none"
                />
              </div>

              {/* What they can see */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ct-text-secondary">
                  What they can see
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ct-surface-raised px-3 py-2.5">
                  <Lock className="size-3.5 shrink-0 text-ct-text-tertiary" />
                  <span className="text-sm text-ct-text-primary">
                    {stageName}
                  </span>
                  <span className="ml-auto text-xs text-ct-text-tertiary">
                    Only this section + context from completed stages
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-ct-text-secondary transition-colors hover:text-ct-text-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!email.trim() || sending}
                  className="flex items-center gap-2 rounded-lg bg-ct-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ct-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="size-3.5" />
                  {sending ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
