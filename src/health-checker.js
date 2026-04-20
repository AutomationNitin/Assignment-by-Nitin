const { fetchSitemapUrls } = require('./sitemap');
const { checkUrlsInParallel } = require('./url-checker');
const { summarizeResults } = require('./reporters/summary');

async function runHealthCheck(options) {
  const pageUrls = await fetchSitemapUrls(options.sitemapUrl, {
    timeoutMs: options.timeoutMs,
    maxUrls: options.maxUrls,
  });

  if (pageUrls.length === 0) {
    throw new Error('No page URLs were found in the sitemap.');
  }

  const results = await checkUrlsInParallel(pageUrls, options);
  const summary = summarizeResults(results);

  return {
    sitemapUrl: options.sitemapUrl,
    generatedAt: new Date().toISOString(),
    options: {
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
      maxUrls: options.maxUrls,
    },
    results,
    summary,
  };
}

module.exports = {
  runHealthCheck,
};
