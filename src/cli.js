#!/usr/bin/env node

const { runHealthCheck } = require('./health-checker');
const { parseCliArgs, printUsage } = require('./config');
const { printReport } = require('./reporters/table');
const { writeJsonReport, writeCsvReport } = require('./reporters/exporters');

async function main() {
  const options = parseCliArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (!options.sitemapUrl) {
    console.error('Missing required argument: --sitemap <url>');
    printUsage();
    process.exitCode = 1;
    return;
  }

  try {
    const report = await runHealthCheck(options);
    printReport(report);

    if (options.outputJson) {
      const filePath = await writeJsonReport(report, options.outputJson);
      console.log(`\nJSON report written to ${filePath}`);
    }

    if (options.outputCsv) {
      const filePath = await writeCsvReport(report, options.outputCsv);
      console.log(`CSV report written to ${filePath}`);
    }

    if (report.summary.brokenCount > 0) {
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(`Health check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
