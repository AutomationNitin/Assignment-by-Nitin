const path = require('node:path');

function normalizeSitemapUrl(value) {
  return normalizeUrl(value, 'sitemap');
}

function normalizePageUrl(value) {
  return normalizeUrl(value, 'page');
}

function normalizeUrl(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid ${label} URL.`);
  }

  const parsed = new URL(value.trim());

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Only HTTP and HTTPS URLs are allowed for ${label} values.`);
  }

  if (!parsed.hostname) {
    throw new Error(`Invalid ${label} URL.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`Credentials are not allowed in ${label} URLs.`);
  }

  parsed.hash = '';
  return parsed.toString();
}

function resolveReportPath(targetPath) {
  if (typeof targetPath !== 'string' || !targetPath.trim()) {
    throw new Error('Output path is required.');
  }

  const resolvedPath = path.resolve(targetPath.trim());
  const cwd = process.cwd();
  const relativePath = path.relative(cwd, resolvedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Report output paths must stay within the current project directory.');
  }

  return resolvedPath;
}

module.exports = {
  normalizePageUrl,
  normalizeSitemapUrl,
  resolveReportPath,
};
