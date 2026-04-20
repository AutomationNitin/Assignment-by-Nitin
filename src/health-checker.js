const { fetchSitemapUrls } = require('./sitemap');
const { checkUrlsInParallel } = require('./url-checker');
const { summarizeResults } = require('./reporters/summary');
const { normalizeSitemapUrl } = require('./utils/urls');

async function runHealthCheck(options) {
  const sitemapUrl = normalizeSitemapUrl(options.sitemapUrl);
  const pageUrls = await fetchSitemapUrls(sitemapUrl, {
    timeoutMs: options.timeoutMs,
    maxUrls: options.maxUrls,
    maxSitemaps: options.maxSitemaps,
    maxSitemapDepth: options.maxSitemapDepth,
    maxSitemapBytes: options.maxSitemapBytes,
  });

  if (pageUrls.length === 0) {
    throw new Error('No page URLs were found in the sitemap.');
  }

  const results = await checkUrlsInParallel(pageUrls, options);
  const summary = summarizeResults(results);

  return {
    sitemapUrl,
    generatedAt: new Date().toISOString(),
    options: {
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
      retries: options.retries,
      maxUrls: options.maxUrls,
      maxSitemaps: options.maxSitemaps,
      maxSitemapDepth: options.maxSitemapDepth,
      maxSitemapBytes: options.maxSitemapBytes,
    },
    results,
    summary,
  };
}

module.exports = {
  runHealthCheck,
};
