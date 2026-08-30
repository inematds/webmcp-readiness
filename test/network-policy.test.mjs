import assert from "node:assert/strict";
import test from "node:test";
import { validateTarget } from "../lib/network-policy.mjs";

test("recusa protocolos fora de HTTP e HTTPS", async () => {
  await assert.rejects(() => validateTarget("file:///etc/passwd"), /Somente URLs HTTP ou HTTPS/);
});

test("recusa URLs com credenciais embutidas", async () => {
  await assert.rejects(() => validateTarget("https://user:secret@example.com"), /credenciais embutidas/);
});

test("recusa endereço local", async () => {
  await assert.rejects(() => validateTarget("http://127.0.0.1"), /rede privada/);
});

test("aceita um domínio público resolvível", async () => {
  const result = await validateTarget("https://example.com/");
  assert.equal(result.target.hostname, "example.com");
  assert.ok(result.approvedAddresses.length > 0);
});
