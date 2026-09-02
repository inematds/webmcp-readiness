import assert from "node:assert/strict";
import test from "node:test";
import { mergeTools } from "../lib/readiness.mjs";

test("D5: a mesma ferramenta declarativa e imperativa conta uma vez", () => {
  const merged = mergeTools(
    [{ kind: "declarative", name: "buscar_cursos", description: "Busca cursos.", fields: [] }],
    [{ kind: "imperative", name: "buscar_cursos", description: "Busca cursos pelo tema.", inputSchema: { type: "object" }, annotations: { readOnlyHint: true } },
     { kind: "imperative", name: "outra", description: "Outra.", inputSchema: null, annotations: {} }]
  );
  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0].sources, ["declarative", "imperative"]);
  assert.equal(merged[0].inputSchema.type, "object");
  assert.equal(merged[0].annotations.readOnlyHint, true);
});
