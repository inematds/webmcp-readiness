export function createScanLogEntry(report) {
  const rawUrl = report?.finalUrl || report?.requestedUrl;
  const score = Number(report?.score);

  if (!rawUrl || !Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }

  try {
    return {
      site: new URL(rawUrl).origin,
      score: Math.round(score)
    };
  } catch {
    return null;
  }
}

export function recordScanLog(report, write = console.info) {
  const entry = createScanLogEntry(report);
  if (!entry) return false;

  try {
    write(JSON.stringify(entry));
    return true;
  } catch {
    // Uma falha no observador nunca deve invalidar o relatório do usuário.
    return false;
  }
}
