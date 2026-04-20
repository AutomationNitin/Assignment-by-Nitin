const fs = require('node:fs/promises');
const { resolveReportPath } = require('../utils/urls');

async function writeJsonReport(report, targetPath) {
  const resolvedPath = resolveReportPath(targetPath);
  await ensureParentDirectory(resolvedPath);
  await fs.writeFile(resolvedPath, JSON.stringify(report, null, 2), 'utf8');
  return resolvedPath;
}

async function writeCsvReport(report, targetPath) {
  const resolvedPath = resolveReportPath(targetPath);
  await ensureParentDirectory(resolvedPath);

  const lines = [
    'Page Name,Page URL,Category,Status Code,Response Time (ms),Error',
    ...report.results.map((result) => [
      csvEscape(result.pageName),
      csvEscape(result.pageUrl),
      csvEscape(result.category),
      csvEscape(String(result.statusCode)),
      csvEscape(String(result.responseTimeMs)),
      csvEscape(result.error || ''),
    ].join(',')),
  ];

  await fs.writeFile(resolvedPath, `${lines.join('\n')}\n`, 'utf8');
  return resolvedPath;
}

async function ensureParentDirectory(filePath) {
  await fs.mkdir(require('node:path').dirname(filePath), { recursive: true });
}

function csvEscape(value) {
  const normalized = String(value).replace(/"/g, '""');
  return `"${normalized}"`;
}

module.exports = {
  writeJsonReport,
  writeCsvReport,
};
