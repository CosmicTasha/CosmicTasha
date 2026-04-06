"use client";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";

/* ------------------------------------------------------------------ */
/*  Markdown line parser                                               */
/* ------------------------------------------------------------------ */

interface ParsedLine {
  type:
    | "h1"
    | "h2"
    | "h3"
    | "ul"
    | "ol"
    | "table-row"
    | "table-separator"
    | "paragraph"
    | "blank";
  text: string;
}

function classifyLine(line: string): ParsedLine {
  if (line.trim() === "") return { type: "blank", text: "" };
  if (line.match(/^###\s+/)) return { type: "h3", text: line.replace(/^###\s+/, "") };
  if (line.match(/^##\s+/)) return { type: "h2", text: line.replace(/^##\s+/, "") };
  if (line.match(/^#\s+/)) return { type: "h1", text: line.replace(/^#\s+/, "") };
  if (line.match(/^\s*-\s+/)) return { type: "ul", text: line.replace(/^\s*-\s+/, "") };
  if (line.match(/^\s*\d+\.\s+/))
    return { type: "ol", text: line.replace(/^\s*\d+\.\s+/, "") };
  if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
    if (line.match(/^\s*\|[\s:-]+\|\s*$/)) {
      return { type: "table-separator", text: line };
    }
    return { type: "table-row", text: line };
  }
  return { type: "paragraph", text: line };
}

/* ------------------------------------------------------------------ */
/*  Inline formatting to TextRun[]                                     */
/* ------------------------------------------------------------------ */

function parseInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];

  // Regex to match **bold**, *italic*, and [REVIEW] tags
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[REVIEW\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }

    if (match[0] === "[REVIEW]") {
      runs.push(
        new TextRun({
          text: "[REVIEW]",
          bold: true,
          shading: {
            type: ShadingType.CLEAR,
            color: "auto",
            fill: "FEF3C7",
          },
        }),
      );
    } else if (match[1] !== undefined) {
      // **bold**
      runs.push(new TextRun({ text: match[1], bold: true }));
    } else if (match[2] !== undefined) {
      // *italic*
      runs.push(new TextRun({ text: match[2], italics: true }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  // If nothing was parsed, push the original text
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

/* ------------------------------------------------------------------ */
/*  Table builder                                                      */
/* ------------------------------------------------------------------ */

function buildTable(rows: string[][]): Table {
  const headerRow = rows[0] ?? [];
  const bodyRows = rows.slice(1);

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "D1D5DB",
  };

  const borders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map(
          (cell) =>
            new TableCell({
              borders,
              shading: { type: ShadingType.CLEAR, color: "auto", fill: "F3F4F6" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: cell, bold: true, size: 20, font: "Calibri" }),
                  ],
                }),
              ],
            }),
        ),
      }),
      ...bodyRows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  borders,
                  children: [
                    new Paragraph({
                      children: parseInlineRuns(cell),
                    }),
                  ],
                }),
            ),
          }),
      ),
    ],
  });
}

/* ------------------------------------------------------------------ */
/*  Section to docx elements                                           */
/* ------------------------------------------------------------------ */

type DocElement = Paragraph | Table;

function sectionToElements(
  section: { title: string; content: string },
  isFirst: boolean,
): DocElement[] {
  const elements: DocElement[] = [];

  // Section heading with optional page break
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: parseInlineRuns(section.title),
      pageBreakBefore: !isFirst,
    }),
  );

  // Parse content lines
  const lines = section.content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const classified = classifyLine(lines[i]);

    switch (classified.type) {
      case "blank":
        i++;
        break;

      case "h1":
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: parseInlineRuns(classified.text),
          }),
        );
        i++;
        break;

      case "h2":
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: parseInlineRuns(classified.text),
          }),
        );
        i++;
        break;

      case "h3":
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: parseInlineRuns(classified.text),
          }),
        );
        i++;
        break;

      case "ul":
        elements.push(
          new Paragraph({
            bullet: { level: 0 },
            children: parseInlineRuns(classified.text),
          }),
        );
        i++;
        break;

      case "ol": {
        elements.push(
          new Paragraph({
            numbering: { reference: "default-numbering", level: 0 },
            children: parseInlineRuns(classified.text),
          }),
        );
        i++;
        break;
      }

      case "table-row": {
        // Collect all table rows
        const tableRows: string[][] = [];
        while (i < lines.length) {
          const cl = classifyLine(lines[i]);
          if (cl.type === "table-row") {
            const cells = lines[i]
              .replace(/^\s*\|/, "")
              .replace(/\|\s*$/, "")
              .split("|")
              .map((c) => c.trim());
            tableRows.push(cells);
            i++;
          } else if (cl.type === "table-separator") {
            i++; // skip separator
          } else {
            break;
          }
        }
        if (tableRows.length > 0) {
          elements.push(buildTable(tableRows));
        }
        break;
      }

      case "table-separator":
        i++;
        break;

      default: {
        // Paragraph: accumulate consecutive paragraph lines
        const paraLines: string[] = [];
        while (i < lines.length) {
          const cl = classifyLine(lines[i]);
          if (cl.type === "paragraph") {
            paraLines.push(cl.text);
            i++;
          } else {
            break;
          }
        }
        if (paraLines.length > 0) {
          elements.push(
            new Paragraph({
              children: parseInlineRuns(paraLines.join(" ")),
              spacing: { after: 200 },
            }),
          );
        }
        break;
      }
    }
  }

  return elements;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Export document sections as a DOCX file.
 * Generates a title page, then each section on its own page.
 */
export async function exportToDocx(
  documentName: string,
  companyName: string,
  sections: { title: string; content: string }[],
): Promise<void> {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Title page elements
  const titlePageElements: Paragraph[] = [
    new Paragraph({ spacing: { before: 4000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: documentName,
          bold: true,
          size: 56,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: companyName,
          size: 32,
          color: "6B7280",
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Generated by CosmicTasha",
          size: 22,
          color: "9CA3AF",
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: date,
          size: 22,
          color: "9CA3AF",
          font: "Calibri",
        }),
      ],
    }),
  ];

  // Section content
  const sectionElements: DocElement[] = [];
  sections.forEach((section, idx) => {
    const els = sectionToElements(section, idx === 0);
    sectionElements.push(...els);
  });

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [
            {
              level: 0,
              format: "decimal" as const,
              text: "%1.",
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        children: [...titlePageElements, ...sectionElements],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = documentName.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_");
  saveAs(blob, `${filename}.docx`);
}
