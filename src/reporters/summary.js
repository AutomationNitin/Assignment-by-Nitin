function summarizeResults(results) {
  const summary = {
    totalUrls: results.length,
    healthyCount: 0,
    redirectedCount: 0,
    brokenCount: 0,
    averageResponseTimeMs: 0,
  };

  let totalResponseTimeMs = 0;

  for (const result of results) {
    if (result.category === 'Healthy') {
      summary.healthyCount += 1;
    } else if (result.category === 'Redirected') {
      summary.redirectedCount += 1;
    } else {
      summary.brokenCount += 1;
    }

    totalResponseTimeMs += Number(result.responseTimeMs) || 0;
  }

  summary.averageResponseTimeMs = results.length === 0
    ? 0
    : Math.round((totalResponseTimeMs / results.length) * 100) / 100;

  return summary;
}

module.exports = {
  summarizeResults,
};
