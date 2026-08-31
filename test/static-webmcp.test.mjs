import assert from "node:assert/strict";
import test from "node:test";
import { discoverStaticWebMcpTools } from "../lib/static-webmcp.mjs";

test("descobre ferramenta imperativa em bundle minificado", () => {
  const source = `let tools=[{name:"buscar_catalogo",title:"Buscar catálogo",description:"Pesquisa o catálogo público sem alterar dados.",inputSchema:{type:"object",properties:{}},annotations:{readOnlyHint:!0,idempotentHint:true,openWorldHint:false},execute:async()=>({ok:true})}];tools.map(t=>document.modelContext.registerTool(t));`;
  const tools = discoverStaticWebMcpTools(source);
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, "buscar_catalogo");
  assert.equal(tools[0].description, "Pesquisa o catálogo público sem alterar dados.");
  assert.equal(tools[0].inputSchema.type, "object");
  assert.equal(tools[0].annotations.readOnlyHint, true);
});

test("não confunde objetos comuns com ferramentas", () => {
  const source = `const user={name:"maria",description:"perfil comum",execute:true};`;
  assert.deepEqual(discoverStaticWebMcpTools(source), []);
});

test("exige sinais de schema ou annotations próximos ao nome", () => {
  const source = `const item={name:"produto",description:"Um produto comum da vitrine",execute(){}};document.modelContext.registerTool(item);`;
  assert.deepEqual(discoverStaticWebMcpTools(source), []);
});
