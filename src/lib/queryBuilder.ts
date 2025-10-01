export type OperatorKey =
  | "site"
  | "intitle"
  | "inurl"
  | "filetype"
  | "exact"
  | "exclude"
  | "or"
  | "range"
  | "after"
  | "before";

export interface OperatorTokenBase {
  id: string;
  key: OperatorKey;
  label: string;
}

export type OperatorToken =
  | (OperatorTokenBase & { key: "site"; value: string })
  | (OperatorTokenBase & { key: "intitle"; value: string })
  | (OperatorTokenBase & { key: "inurl"; value: string })
  | (OperatorTokenBase & { key: "filetype"; value: string })
  | (OperatorTokenBase & { key: "exact"; value: string })
  | (OperatorTokenBase & { key: "exclude"; value: string })
  | (OperatorTokenBase & { key: "after"; value: string })
  | (OperatorTokenBase & { key: "before"; value: string })
  | (OperatorTokenBase & { key: "range"; value: { from: number; to: number } })
  | (OperatorTokenBase & { key: "or"; value: string[] });

export interface QueryModel {
  freeText: string;
  tokens: OperatorToken[];
}

export function buildQuery(model: QueryModel): string {
  const parts: string[] = [];

  if (model.freeText.trim().length > 0) {
    parts.push(model.freeText.trim());
  }

  for (const token of model.tokens) {
    switch (token.key) {
      case "site":
        if (token.value) parts.push(`site:${sanitize(token.value)}`);
        break;
      case "intitle":
        if (token.value) parts.push(`intitle:${quoteIfNeeded(token.value)}`);
        break;
      case "inurl":
        if (token.value) parts.push(`inurl:${quoteIfNeeded(token.value)}`);
        break;
      case "filetype":
        if (token.value) parts.push(`filetype:${sanitize(token.value)}`);
        break;
      case "exact":
        if (token.value) parts.push(`"${escapeQuotes(token.value)}"`);
        break;
      case "exclude":
        if (token.value) parts.push(`-${quoteIfNeeded(token.value)}`);
        break;
      case "after":
        if (isISODate(token.value)) parts.push(`after:${token.value}`);
        break;
      case "before":
        if (isISODate(token.value)) parts.push(`before:${token.value}`);
        break;
      case "range":
        if (typeof token.value?.from === "number" && typeof token.value?.to === "number") {
          parts.push(`${token.value.from}..${token.value.to}`);
        }
        break;
      case "or":
        if (Array.isArray(token.value) && token.value.length > 0) {
          const orGroup = token.value.map(v => quoteIfNeeded(v)).join(" OR ");
          parts.push(`(${orGroup})`);
        }
        break;
    }
  }

  return parts.join(" ").trim();
}

export function openInGoogle(query: string) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function sanitize(input: string): string {
  return input.replace(/\s+/g, "");
}

function escapeQuotes(input: string): string {
  return input.replace(/"/g, '\\"');
}

function quoteIfNeeded(value: string): string {
  return /\s/.test(value) ? `"${escapeQuotes(value)}"` : value;
}

function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const DEFAULT_OPERATORS: Array<{ key: OperatorKey; label: string; hint: string }> = [
  { key: "site", label: "Site", hint: "Limit results to a domain (site:example.com)" },
  { key: "intitle", label: "In Title", hint: "Find words in page title" },
  { key: "inurl", label: "In URL", hint: "Find words in URL path" },
  { key: "filetype", label: "Filetype", hint: "Restrict by file extension (pdf, docx)" },
  { key: "exact", label: "Exact Phrase", hint: "Match exact phrase using quotes" },
  { key: "exclude", label: "Exclude Term", hint: "Exclude a term using minus" },
  { key: "range", label: "Number Range", hint: "Search within numeric range (10..20)" },
  { key: "after", label: "After Date", hint: "Only results after YYYY-MM-DD" },
  { key: "before", label: "Before Date", hint: "Only results before YYYY-MM-DD" },
  { key: "or", label: "OR Group", hint: "Any of terms (term1 OR term2)" },
];




