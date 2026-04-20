function printReport(report) {
  const rows = report.results.map((result) => ({
    'Page Name': result.pageName,
    'Page URL': result.pageUrl,
    Category: result.category,
    'Status Code': result.statusCode,
    'Response Time (ms)': result.responseTimeMs,
    Error: result.error || '',
  }));

  console.log(`\nSitemap URL Health Report`);
  console.log(`Sitemap: ${report.sitemapUrl}`);
  console.log(`Generated: ${report.generatedAt}\n`);
  console.table(rows);

  console.log('Summary');
  console.log(`Total URLs processed: ${report.summary.totalUrls}`);
  console.log(`Healthy URLs: ${report.summary.healthyCount}`);
  console.log(`Redirected URLs: ${report.summary.redirectedCount}`);
  console.log(`Broken URLs: ${report.summary.brokenCount}`);
  console.log(`Average response time: ${report.summary.averageResponseTimeMs} ms`);
}

module.exports = {
  printReport,
};
