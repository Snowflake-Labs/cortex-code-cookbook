import { makePrismLightSyntaxHighlighter } from "@assistant-ui/react-syntax-highlighter";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import { PrismLight } from "react-syntax-highlighter";

PrismLight.registerLanguage("sql", sql);

// Theme using CSS variables — adapts to light and dark mode automatically
const cortexCodeTheme = {
  'code[class*="language-"]': {
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    lineHeight: "1.65",
    color: "var(--fg-default)",
    background: "var(--bg-tool-body)",
    hyphens: "none" as const,
    tabSize: 2,
  },
  'pre[class*="language-"]': {
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    lineHeight: "1.65",
    color: "var(--fg-default)",
    background: "var(--bg-tool-body)",
    padding: "0.75rem 1rem",
    margin: 0,
    overflow: "auto",
  },
  keyword:     { color: "var(--sf-blue-50)", fontWeight: "600" },
  builtin:     { color: "var(--sf-blue-50)" },
  function:    { color: "var(--sf-sky)" },
  "class-name":{ color: "var(--sf-sky)" },
  string:      { color: "var(--fg-success)" },
  number:      { color: "var(--sf-sky)" },
  boolean:     { color: "var(--sf-blue-50)" },
  comment:     { color: "var(--fg-muted)", fontStyle: "italic" },
  operator:    { color: "var(--fg-secondary)" },
  punctuation: { color: "var(--fg-muted)" },
  symbol:      { color: "var(--sf-sky)" },
  variable:    { color: "var(--fg-default)" },
  property:    { color: "var(--fg-secondary)" },
  tag:         { color: "var(--sf-blue-50)" },
  "attr-name": { color: "var(--fg-secondary)" },
  "attr-value":{ color: "var(--fg-success)" },
  regex:       { color: "var(--fg-success)" },
  important:   { color: "var(--sf-amber)", fontWeight: "600" },
};

export const SyntaxHighlighter = makePrismLightSyntaxHighlighter({
  style: cortexCodeTheme as any,
  customStyle: { margin: 0, borderRadius: 0 },
});
