# Security policy

## Supported versions

CosmicTasha is currently in alpha. Only the latest minor release receives security fixes.

|Version|Supported|
|-------|---------|
|`0.1.x`|Yes|
|`< 0.1.0`|No|

## Reporting a vulnerability

**Please do not open a public issue for security bugs.**

The preferred channel is GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/CosmicTasha/CosmicTasha/security) of this repository.
2. Click **Report a vulnerability**.
3. Fill out the form. You will get an acknowledgement within 72 hours.

If GitHub Security Advisories are not available to you, you can also reach the maintainers by opening a draft pull request that demonstrates the issue against a private fork and emailing the link to the maintainer listed in the repository profile.

## What to include

A useful report contains:

- The affected version (commit SHA, release tag, or `master@<date>`)
- A description of the vulnerability and its impact
- Steps to reproduce (a minimal proof-of-concept is ideal)
- Any suggested remediation if you have one

## Response process

1. **Acknowledgement** — within 72 hours of receipt.
2. **Triage** — within 7 days we will confirm whether we accept the report and an estimated severity.
3. **Fix and disclosure** — we aim to ship a patched release within 30 days of confirmation for high-severity issues and 90 days for everything else. Coordinated disclosure is preferred; we will work with you on a public-disclosure timeline.
4. **Credit** — with your permission we will credit you in the release notes and the GitHub Security Advisory.

## Scope

In scope:

- The web application in [`web/`](web/)
- Server-side code that runs as part of the production Docker Compose stack
- Authentication, session, and RLS handling
- The ScoreRift scoring code in [`ray_scorer_prototype.py`](ray_scorer_prototype.py)
- Build and CI pipeline configuration

Out of scope:

- The separate `biged-rs` service (report there directly)
- Third-party dependencies — please report upstream first; we will track and roll forward
- Issues that require a compromised local environment to exploit
- Findings against default development credentials (`changeme`, `devpassword`) — these are documented as unsafe defaults and the README warns against shipping them
