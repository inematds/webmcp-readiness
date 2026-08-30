import dns from "node:dns/promises";
import net from "node:net";

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./
];

function isPrivateAddress(address) {
  if (net.isIPv4(address)) return PRIVATE_V4.some((pattern) => pattern.test(address));
  if (!net.isIPv6(address)) return true;
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") ||
    normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export async function validateTarget(rawUrl) {
  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    throw new Error("Informe uma URL completa, incluindo https://.");
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Somente URLs HTTP ou HTTPS podem ser analisadas.");
  }

  if (target.username || target.password) {
    throw new Error("URLs com credenciais embutidas não são aceitas.");
  }

  const allowPrivate = process.env.ALLOW_PRIVATE_TARGETS === "1";
  const records = await dns.lookup(target.hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error("O domínio informado não pôde ser resolvido.");

  if (!allowPrivate && records.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Endereços locais ou de rede privada estão bloqueados. Use ALLOW_PRIVATE_TARGETS=1 apenas em desenvolvimento.");
  }

  return { target, approvedAddresses: records.map(({ address }) => address) };
}
