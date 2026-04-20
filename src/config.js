const DEFAULTS = {
  concurrency: 20,
  timeoutMs: 10000,
  retries: 2,
  maxUrls: 0,
};

function parseCliArgs(args) {
  const options = {
    ...DEFAULTS,
    help: false,
    sitemapUrl: '',
    outputJson: '',
    outputCsv: '',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--sitemap':
      case '-s':
        options.sitemapUrl = next || '';
        index += 1;
        break;
      case '--concurrency':
      case '-c':
        options.concurrency = toPositiveInteger(next, 'concurrency');
        index += 1;
        break;
      case '--timeout':
      case '-t':
        options.timeoutMs = toPositiveInteger(next, 'timeout');
        index += 1;
        break;
      case '--retries':
      case '-r':
        options.retries = toNonNegativeInteger(next, 'retries');
        index += 1;
        break;
      case '--max-urls':
        options.maxUrls = toNonNegativeInteger(next, 'max-urls');
        index += 1;
        break;
      case '--json':
        options.outputJson = next || '';
        index += 1;
        break;
      case '--csv':
        options.outputCsv = next || '';
        index += 1;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown argument: ${arg}`);
        }
    }
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  node src/cli.js --sitemap <url> [options]

Options:
  --sitemap, -s       Sitemap XML URL to validate
  --concurrency, -c   Number of URLs to process in parallel (default: 20)
  --timeout, -t       Request timeout in milliseconds (default: 10000)
  --retries, -r       Retry attempts for failed requests (default: 2)
  --max-urls          Limit the number of page URLs processed (default: unlimited)
  --json              Write the report to a JSON file
  --csv               Write the report to a CSV file
  --help, -h          Show this help message

Examples:
  npm.cmd run check:sitemap -- --sitemap https://example.com/sitemap.xml
  node src/cli.js --sitemap https://example.com/sitemap.xml --json reports/report.json --csv reports/report.csv`);
}

function toPositiveInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${flagName} value: ${value}`);
  }
  return parsed;
}

function toNonNegativeInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${flagName} value: ${value}`);
  }
  return parsed;
}

module.exports = {
  DEFAULTS,
  parseCliArgs,
  printUsage,
};
