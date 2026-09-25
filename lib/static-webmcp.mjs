const TOOL_NAME = /(?:^|[,{;])\s*(?:name|["']name["'])\s*:\s*["']([a-z][a-z0-9_-]{2,79})["']/g;
// Bundlers routinely rename the model-context variable to a single letter, so
// the stable signal is the method call, paired with the object-shape checks
// below rather than a particular variable name.
const REGISTER_TOOL = /(?:\.|\?\.)registerTool\s*\(/;

function stringProperty(source, property) {
  const match = source.match(new RegExp(`(?:${property}|["']${property}["'])\\s*:\\s*(["'\\x60])([\\s\\S]{0,700}?)\\1`));
  return match?.[2]?.replace(/\\n/g, " ").replace(/\\s+/g, " ").trim() || "";
}

function trueProperty(source, property) {
  return new RegExp(`(?:${property}|["']${property}["'])\\s*:\\s*(?:true|!0)`).test(source);
}

/**
 * Heurística conservadora para bundles: só aceita objetos com nome que estejam
 * próximos de sinais próprios de uma definição WebMCP e quando o bundle também
 * contém uma chamada a registerTool(). Não executa o JavaScript.
 */
export function discoverStaticWebMcpTools(source) {
  if (typeof source !== "string" || !REGISTER_TOOL.test(source)) return [];

  const tools = new Map();
  for (const match of source.matchAll(TOOL_NAME)) {
    const start = Math.max(0, match.index - 180);
    const end = Math.min(source.length, match.index + 1800);
    const window = source.slice(start, end);
    if (!/(?:inputSchema|annotations|readOnlyHint|idempotentHint)/.test(window) || !/(?:execute|handler)/.test(window)) continue;

    const name = match[1];
    if (tools.has(name)) continue;
    const hasObjectSchema = /inputSchema["']?\s*:\s*\{[\s\S]{0,900}?(?:type|["']type["'])\s*:\s*["']object["']/.test(window);
    tools.set(name, {
      kind: "imperative-static",
      name,
      title: stringProperty(window, "title"),
      description: stringProperty(window, "description"),
      inputSchema: hasObjectSchema ? { type: "object", detectedStatically: true } : null,
      annotations: {
        readOnlyHint: trueProperty(window, "readOnlyHint"),
        untrustedContentHint: trueProperty(window, "untrustedContentHint"),
        consequentialHint: trueProperty(window, "consequentialHint"),
        debugging: trueProperty(window, "debugging")
      },
      detectedStatically: true
    });
  }
  return [...tools.values()];
}
