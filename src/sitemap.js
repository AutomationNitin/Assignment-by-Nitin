const { fetchWithTimeout } = require('./utils/http');

async function fetchSitemapUrls(sitemapUrl, options) {
  const visited = new Set();
  const pageUrls = [];

  await walkSitemap(sitemapUrl, visited, pageUrls, options);

  const unique = [...new Set(pageUrls)];
  if (options.maxUrls > 0) {
    return unique.slice(0, options.maxUrls);
  }

  return unique;
}

async function walkSitemap(sitemapUrl, visited, pageUrls, options) {
  if (visited.has(sitemapUrl)) {
    return;
  }

  visited.add(sitemapUrl);

  const response = await fetchWithTimeout(sitemapUrl, {
    timeoutMs: options.timeoutMs,
    redirect: 'follow',
    headers: {
      'accept': 'application/xml,text/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'sitemap-health-checker/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch sitemap ${sitemapUrl} (HTTP ${response.status})`);
  }

  const xml = await response.text();
  validateXmlContent(xml, sitemapUrl);

  const nestedSitemaps = extractSitemapLocs(xml);
  if (nestedSitemaps.length > 0) {
    for (const nestedSitemapUrl of nestedSitemaps) {
      await walkSitemap(nestedSitemapUrl, visited, pageUrls, options);

      if (options.maxUrls > 0 && pageUrls.length >= options.maxUrls) {
        return;
      }
    }
    return;
  }

  const urlLocs = extractUrlLocs(xml);
  pageUrls.push(...urlLocs);
}

function validateXmlContent(xml, sitemapUrl) {
  if (typeof xml !== 'string' || !xml.trim()) {
    throw new Error(`Sitemap ${sitemapUrl} returned an empty response.`);
  }

  if (!/<(urlset|sitemapindex)\b/i.test(xml)) {
    throw new Error(`Sitemap ${sitemapUrl} is not a valid sitemap XML document.`);
  }
}

function extractSitemapLocs(xml) {
  const sitemapBlocks = [...xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)];
  return sitemapBlocks
    .map((match) => extractSingleLoc(match[0]))
    .filter(Boolean);
}

function extractUrlLocs(xml) {
  const urlBlocks = [...xml.matchAll(/<url\b[\s\S]*?<\/url>/gi)];
  return urlBlocks
    .map((match) => extractSingleLoc(match[0]))
    .filter(Boolean);
}

function extractSingleLoc(xmlFragment) {
  const match = xmlFragment.match(/<loc>([\s\S]*?)<\/loc>/i);
  if (!match) {
    return '';
  }

  return decodeXmlEntities(match[1].trim());
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

module.exports = {
  fetchSitemapUrls,
};
