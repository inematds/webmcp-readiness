import assert from "node:assert/strict";
import test from "node:test";
import { isPrivateAddress, validateTarget } from "../lib/network-policy.mjs";

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

test("D6: IPv4 mapeado em IPv6 e CGNAT são privados", () => {
  assert.equal(isPrivateAddress("::ffff:127.0.0.1"), true);
  assert.equal(isPrivateAddress("::ffff:10.0.0.1"), true);
  assert.equal(isPrivateAddress("::ffff:169.254.169.254"), true);
  assert.equal(isPrivateAddress("100.64.0.1"), true);
  assert.equal(isPrivateAddress("100.127.255.254"), true);
  assert.equal(isPrivateAddress("100.128.0.1"), false);
  assert.equal(isPrivateAddress("::ffff:93.184.216.34"), false);
  assert.equal(isPrivateAddress("2606:4700::1111"), false);
});
