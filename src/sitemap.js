const { fetchWithTimeout } = require('./utils/http');
const { normalizePageUrl, normalizeSitemapUrl } = require('./utils/urls');

async function fetchSitemapUrls(sitemapUrl, options) {
  const visited = new Set();
  const pageUrls = [];

  await walkSitemap(normalizeSitemapUrl(sitemapUrl), visited, pageUrls, options, 0);

  const unique = [...new Set(pageUrls)];
  if (options.maxUrls > 0) {
    return unique.slice(0, options.maxUrls);
  }

  return unique;
}

async function walkSitemap(sitemapUrl, visited, pageUrls, options, depth) {
  if (depth > options.maxSitemapDepth) {
    throw new Error(`Sitemap nesting exceeds the allowed depth of ${options.maxSitemapDepth}.`);
  }

  if (visited.has(sitemapUrl)) {
    return;
  }

  if (visited.size >= options.maxSitemaps) {
    throw new Error(`Sitemap traversal exceeded the limit of ${options.maxSitemaps} sitemap files.`);
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

  const contentType = response.headers.get('content-type') || '';
  if (contentType && !/(xml|text\/plain|application\/octet-stream)/i.test(contentType)) {
    throw new Error(`Sitemap ${sitemapUrl} returned an unexpected content type: ${contentType}`);
  }

  const contentLength = Number.parseInt(response.headers.get('content-length') || '', 10);
  if (Number.isFinite(contentLength) && contentLength > options.maxSitemapBytes) {
    throw new Error(`Sitemap ${sitemapUrl} exceeds the size limit of ${options.maxSitemapBytes} bytes.`);
  }

  const xml = await response.text();
  validateXmlContent(xml, sitemapUrl, options.maxSitemapBytes);

  const nestedSitemaps = extractSitemapLocs(xml);
  if (nestedSitemaps.length > 0) {
    for (const nestedSitemapUrl of nestedSitemaps) {
      await walkSitemap(nestedSitemapUrl, visited, pageUrls, options, depth + 1);

      if (options.maxUrls > 0 && pageUrls.length >= options.maxUrls) {
        return;
      }
    }
    return;
  }

  const urlLocs = extractUrlLocs(xml);
  pageUrls.push(...urlLocs);
}

function validateXmlContent(xml, sitemapUrl, maxSitemapBytes) {
  if (typeof xml !== 'string' || !xml.trim()) {
    throw new Error(`Sitemap ${sitemapUrl} returned an empty response.`);
  }

  if (Buffer.byteLength(xml, 'utf8') > maxSitemapBytes) {
    throw new Error(`Sitemap ${sitemapUrl} exceeds the size limit of ${maxSitemapBytes} bytes.`);
  }

  if (!/<(urlset|sitemapindex)\b/i.test(xml)) {
    throw new Error(`Sitemap ${sitemapUrl} is not a valid sitemap XML document.`);
  }
}

function extractSitemapLocs(xml) {
  const sitemapBlocks = [...xml.matchAll(/<sitemap\b[\s\S]*?<\/sitemap>/gi)];
  return sitemapBlocks
    .map((match) => extractSingleLoc(match[0], normalizeSitemapUrl))
    .filter(Boolean);
}

function extractUrlLocs(xml) {
  const urlBlocks = [...xml.matchAll(/<url\b[\s\S]*?<\/url>/gi)];
  return urlBlocks
    .map((match) => extractSingleLoc(match[0], normalizePageUrl))
    .filter(Boolean);
}

function extractSingleLoc(xmlFragment, normalizer) {
  const match = xmlFragment.match(/<loc>([\s\S]*?)<\/loc>/i);
  if (!match) {
    return '';
  }

  const rawValue = decodeXmlEntities(match[1].trim());

  try {
    return normalizer(rawValue);
  } catch (_) {
    return '';
  }
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
