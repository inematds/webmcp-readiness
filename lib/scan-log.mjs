export function createScanLogEntry(report) {
  const rawUrl = report?.finalUrl || report?.requestedUrl;
  const scores = {
    geral: Number(report?.score),
    webmcp: Number(report?.categories?.webmcp?.score),
    seo: Number(report?.categories?.seo?.score),
    geo: Number(report?.categories?.geo?.score),
    aeo: Number(report?.categories?.aeo?.score)
  };
  const validScores = Object.values(scores).every((score) => (
    Number.isFinite(score) && score >= 0 && score <= 100
  ));

  if (!rawUrl || !validScores) {
    return null;
  }

  try {
    return {
      site: new URL(rawUrl).origin,
      scores: Object.fromEntries(
        Object.entries(scores).map(([key, score]) => [key, Math.round(score)])
      )
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
