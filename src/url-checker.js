const { fetchWithTimeout, sleep } = require('./utils/http');
const { normalizePageUrl } = require('./utils/urls');

async function checkUrlsInParallel(urls, options) {
  const concurrency = Math.min(options.concurrency, urls.length);
  const results = new Array(urls.length);
  let cursor = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < urls.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await checkSingleUrl(urls[currentIndex], options);
    }
  });

  await Promise.all(workers);
  return results;
}

async function checkSingleUrl(url, options) {
  const normalizedUrl = normalizePageUrl(url);
  let lastError = null;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      const startedAt = process.hrtime.bigint();
      const response = await fetchWithTimeout(normalizedUrl, {
        timeoutMs: options.timeoutMs,
        redirect: 'manual',
        headers: {
          'user-agent': 'sitemap-health-checker/1.0',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      const responseTimeMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

      return {
        pageName: derivePageName(normalizedUrl),
        pageUrl: normalizedUrl,
        category: categorizeStatus(response.status),
        statusCode: response.status,
        responseTimeMs: roundMs(responseTimeMs),
        error: '',
      };
    } catch (error) {
      lastError = error;

      if (attempt < options.retries) {
        await sleep(200 * (attempt + 1));
      }
    }
  }

  return {
    pageName: derivePageName(normalizedUrl),
    pageUrl: normalizedUrl,
    category: 'Broken',
    statusCode: 'ERROR',
    responseTimeMs: 0,
    error: sanitizeErrorMessage(lastError),
  };
}

function categorizeStatus(statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    return 'Healthy';
  }

  if (statusCode >= 300 && statusCode < 400) {
    return 'Redirected';
  }

  return 'Broken';
}

function derivePageName(url) {
  try {
    const parsed = new URL(url);
    const cleanPath = parsed.pathname.replace(/\/+$/, '');

    if (!cleanPath || cleanPath === '') {
      return 'Homepage';
    }

    const lastSegment = cleanPath.split('/').filter(Boolean).pop() || 'page';
    const withoutExtension = lastSegment.replace(/\.[a-z0-9]+$/i, '');
    const words = withoutExtension
      .replace(/[-_]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    return titleCase(words || 'Page');
  } catch (_) {
    return 'Unknown Page';
  }
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function roundMs(value) {
  return Math.round(value * 100) / 100;
}

function sanitizeErrorMessage(error) {
  const message = error && error.message ? String(error.message) : 'Unknown error';
  return message.replace(/\s+/g, ' ').trim().slice(0, 250);
}

module.exports = {
  checkUrlsInParallel,
  derivePageName,
  categorizeStatus,
};
