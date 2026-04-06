// ---------------------------------------------------------------------------
// Document sanitization scanner — regex-based MVP
// Detects PII, PHI, credentials, and financial data in text.
// Production upgrade: biged-rs skills with spaCy/Presidio NER.
// ---------------------------------------------------------------------------

export interface ScanResult {
  id: string;
  type: 'pii' | 'phi' | 'credential' | 'financial';
  subtype: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  original: string;
  redacted: string;
  position: { start: number; end: number };
  context: string;
}

// ---------------------------------------------------------------------------
// Context helper — returns ~40 chars before and after the match
// ---------------------------------------------------------------------------

function getContext(text: string, start: number, length: number): string {
  const PAD = 40;
  const ctxStart = Math.max(0, start - PAD);
  const ctxEnd = Math.min(text.length, start + length + PAD);
  const before = text.slice(ctxStart, start);
  const matched = text.slice(start, start + length);
  const after = text.slice(start + length, ctxEnd);
  return `${ctxStart > 0 ? '...' : ''}${before}[${matched}]${after}${ctxEnd < text.length ? '...' : ''}`;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface Pattern {
  regex: RegExp;
  type: ScanResult['type'];
  subtype: string;
  severity: ScanResult['severity'];
  redacted: string;
  /** Optional validator — return false to reject the match (reduces false positives). */
  validate?: (match: string) => boolean;
}

const PATTERNS: Pattern[] = [
  // --- PII ---
  {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    type: 'pii',
    subtype: 'email',
    severity: 'medium',
    redacted: '[EMAIL REDACTED]',
  },
  {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    type: 'pii',
    subtype: 'ssn',
    severity: 'critical',
    redacted: '[SSN REDACTED]',
  },
  {
    regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    type: 'pii',
    subtype: 'phone',
    severity: 'medium',
    redacted: '[PHONE REDACTED]',
    validate: (m) => {
      // Reject if it looks like an SSN (already caught above)
      if (/^\d{3}-\d{2}-\d{4}$/.test(m)) return false;
      // Reject pure 10-digit numbers that are too short for a phone
      // (basic sanity — actual phone numbers are 10 digits in US)
      const digits = m.replace(/\D/g, '');
      return digits.length === 10;
    },
  },

  // --- Credentials ---
  {
    regex: /\b(sk_|pk_|ak_|AKIA)[A-Za-z0-9]{20,}\b/g,
    type: 'credential',
    subtype: 'api_key',
    severity: 'critical',
    redacted: '[API KEY REDACTED]',
  },
  {
    regex: /\bAKIA[A-Z0-9]{16}\b/g,
    type: 'credential',
    subtype: 'aws_key',
    severity: 'critical',
    redacted: '[AWS KEY REDACTED]',
  },
  {
    regex: /(mongodb|postgres|mysql|redis):\/\/[^\s]+/g,
    type: 'credential',
    subtype: 'connection_string',
    severity: 'critical',
    redacted: '[CONNECTION STRING REDACTED]',
  },
  {
    regex: /(password|passwd|secret|token)\s*[=:]\s*["']?[^\s"']+/gi,
    type: 'credential',
    subtype: 'password_in_config',
    severity: 'critical',
    redacted: '[CREDENTIAL REDACTED]',
  },

  // --- Financial ---
  {
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    type: 'financial',
    subtype: 'credit_card',
    severity: 'critical',
    redacted: '[CARD NUMBER REDACTED]',
    validate: (m) => {
      // Basic Luhn check to reduce false positives
      const digits = m.replace(/\D/g, '');
      if (digits.length !== 16) return false;
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        let d = parseInt(digits[digits.length - 1 - i], 10);
        if (i % 2 === 1) {
          d *= 2;
          if (d > 9) d -= 9;
        }
        sum += d;
      }
      return sum % 10 === 0;
    },
  },

  // --- Network ---
  {
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    type: 'pii',
    subtype: 'ip_address',
    severity: 'low',
    redacted: '[IP ADDRESS REDACTED]',
    validate: (m) => {
      // Reject version-number-looking strings (e.g., "2.0.1.3")
      const parts = m.split('.');
      // Version numbers usually start with a small digit followed by 0
      if (parts.every((p) => parseInt(p, 10) < 10)) return false;
      // Reject if any octet is > 255
      if (parts.some((p) => parseInt(p, 10) > 255)) return false;
      // Reject common non-IP patterns: 0.0.0.0
      if (m === '0.0.0.0') return false;
      return true;
    },
  },
];

// ---------------------------------------------------------------------------
// Deduplication — overlapping matches from different patterns
// ---------------------------------------------------------------------------

function dedup(results: ScanResult[]): ScanResult[] {
  // Sort by start position, then by severity (critical first)
  const severityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  results.sort((a, b) => {
    if (a.position.start !== b.position.start)
      return a.position.start - b.position.start;
    return severityRank[a.severity] - severityRank[b.severity];
  });

  const kept: ScanResult[] = [];
  let lastEnd = -1;

  for (const r of results) {
    if (r.position.start >= lastEnd) {
      kept.push(r);
      lastEnd = r.position.end;
    }
    // else: overlapping match — skip the lower-priority one
  }

  return kept;
}

// ---------------------------------------------------------------------------
// Main scanner
// ---------------------------------------------------------------------------

export function scanText(text: string): ScanResult[] {
  const results: ScanResult[] = [];
  let id = 0;

  for (const pattern of PATTERNS) {
    // Reset regex state for each scan
    pattern.regex.lastIndex = 0;

    for (const match of text.matchAll(pattern.regex)) {
      if (pattern.validate && !pattern.validate(match[0])) continue;

      results.push({
        id: `scan_${id++}`,
        type: pattern.type,
        subtype: pattern.subtype,
        severity: pattern.severity,
        original: match[0],
        redacted: pattern.redacted,
        position: {
          start: match.index!,
          end: match.index! + match[0].length,
        },
        context: getContext(text, match.index!, match[0].length),
      });
    }
  }

  return dedup(results);
}
