/**
 * Hand-rolled Markdown-to-HTML converter for the subset of Markdown
 * that CosmicTasha's document generator produces.
 */

/** Highlight [REVIEW] tags with a warm background. */
function highlightReviewTags(html: string): string {
  return html.replace(
    /\[REVIEW\]/g,
    '<span style="background:#fef3c7;padding:2px 6px;border-radius:3px;font-weight:bold">[REVIEW]</span>',
  );
}

/** Convert inline Markdown (bold, italic) to HTML. */
function inlineMarkdown(text: string): string {
  let out = text;
  // Bold: **text**
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Review tags
  out = highlightReviewTags(out);
  return out;
}

/** Parse a Markdown table block (array of lines) into an HTML <table>. */
function parseTable(lines: string[]): string {
  const rows = lines
    .filter((l) => !l.match(/^\s*\|[\s:-]+\|\s*$/)) // skip separator rows
    .map((l) =>
      l
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );

  if (rows.length === 0) return "";

  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  let html = "<table><thead><tr>";
  for (const cell of headerRow) {
    html += `<th>${inlineMarkdown(cell)}</th>`;
  }
  html += "</tr></thead><tbody>";
  for (const row of bodyRows) {
    html += "<tr>";
    for (const cell of row) {
      html += `<td>${inlineMarkdown(cell)}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  return html;
}

/**
 * Convert a Markdown string to HTML.
 *
 * Supported syntax:
 * - `# H1`, `## H2`, `### H3`
 * - `**bold**`, `*italic*`
 * - `- list items` (unordered)
 * - `1. numbered items` (ordered)
 * - `| table | rows |` with `<thead>` / `<tbody>`
 * - Blank lines produce `<p>` breaks
 * - `[REVIEW]` tags are highlighted
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = inlineMarkdown(headingMatch[2]);
      output.push(`<h${level}>${text}</h${level}>`);
      i++;
      continue;
    }

    // Table block
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      output.push(parseTable(tableLines));
      continue;
    }

    // Unordered list
    if (line.match(/^\s*-\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*-\s+/)) {
        items.push(inlineMarkdown(lines[i].replace(/^\s*-\s+/, "")));
        i++;
      }
      output.push(
        "<ul>" + items.map((item) => `<li>${item}</li>`).join("") + "</ul>",
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        items.push(inlineMarkdown(lines[i].replace(/^\s*\d+\.\s+/, "")));
        i++;
      }
      output.push(
        "<ol>" + items.map((item) => `<li>${item}</li>`).join("") + "</ol>",
      );
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,3}\s/) &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].match(/^\s*-\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${inlineMarkdown(paraLines.join(" "))}</p>`);
    }
  }

  return output.join("\n");
}
