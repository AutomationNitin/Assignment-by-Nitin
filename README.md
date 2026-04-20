# Sitemap URL Health Checker

A command-line utility that accepts a sitemap URL, extracts page URLs, checks each page's HTTP health, and prints a structured report with summary metrics.

## Features

- Accepts a sitemap XML URL as input
- Supports standard `urlset` sitemaps and nested `sitemapindex` files
- Captures HTTP status code and response time per page
- Categorizes results as `Healthy`, `Redirected`, or `Broken`
- Processes URLs in parallel for better performance on large sitemaps
- Retries failed requests
- Exports reports as JSON and CSV
- Handles invalid sitemap content, timeouts, and network failures

## Tech Choice

- Language: JavaScript (Node.js)
- Runtime requirement: Node.js 18+ (`fetch` is used; Node 24 is already available in this project)
- External libraries: None required for the core checker

## Project Structure

```text
src/
  cli.js
  config.js
  health-checker.js
  sitemap.js
  url-checker.js
  reporters/
    exporters.js
    summary.js
    table.js
  utils/
    http.js
scripts/
  demo-runner.js
```

## Setup

```powershell
npm.cmd install
```

## Usage

```powershell
npm.cmd run check:sitemap -- --sitemap https://example.com/sitemap.xml
```

### Optional arguments

```text
--concurrency <number>   Number of URLs to process in parallel
--timeout <ms>           Request timeout in milliseconds
--retries <number>       Retry count for failed requests
--max-urls <number>      Limit processed page URLs
--json <path>            Export JSON report
--csv <path>             Export CSV report
```

### Example

```powershell
npm.cmd run check:sitemap -- `
  --sitemap https://example.com/sitemap.xml `
  --concurrency 25 `
  --timeout 8000 `
  --retries 2 `
  --json reports\\report.json `
  --csv reports\\report.csv
```

## Output Format

The CLI prints a table with:

```text
Page Name | Page URL | Category | Status Code
```

It also prints:

- Total URLs processed
- Count of Healthy, Redirected, and Broken URLs
- Average response time

## Assumptions

- A `2xx` response is considered `Healthy`
- A `3xx` response is considered `Redirected`
- A `4xx`, `5xx`, timeout, or network error is considered `Broken`
- Page names are derived from the URL path
- Duplicate URLs are only checked once

## Sample Run

To run a local end-to-end demo without relying on an external website:

```powershell
npm.cmd run demo
```

This starts a temporary local HTTP server, serves a nested sitemap, runs the health checker, and writes sample reports to `sample-output/`.

## Notes on Submission

- The code avoids hardcoded project-specific URLs or credentials
- The solution is modular and designed for maintainability
- Parallel processing and nested sitemap support are included as bonus items
- GitHub push was not performed here because it requires your repository/account access
