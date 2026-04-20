const http = require('node:http');
const path = require('node:path');

const { runHealthCheck } = require('../src/health-checker');
const { printReport } = require('../src/reporters/table');
const { writeJsonReport, writeCsvReport } = require('../src/reporters/exporters');

async function main() {
  const server = createDemoServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const report = await runHealthCheck({
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      concurrency: 5,
      timeoutMs: 5000,
      retries: 1,
      maxUrls: 0,
      outputJson: '',
      outputCsv: '',
    });

    printReport(report);

    const jsonPath = await writeJsonReport(report, path.join('sample-output', 'report.json'));
    const csvPath = await writeCsvReport(report, path.join('sample-output', 'report.csv'));

    console.log(`\nSaved demo reports:\n- ${jsonPath}\n- ${csvPath}`);
  } finally {
    server.close();
  }
}

function createDemoServer() {
  return http.createServer((request, response) => {
    switch (request.url) {
      case '/sitemap.xml':
        response.writeHead(200, { 'content-type': 'application/xml' });
        response.end(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>http://127.0.0.1:${request.socket.localPort}/pages.xml</loc></sitemap>
</sitemapindex>`);
        return;
      case '/pages.xml':
        response.writeHead(200, { 'content-type': 'application/xml' });
        response.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://127.0.0.1:${request.socket.localPort}/</loc></url>
  <url><loc>http://127.0.0.1:${request.socket.localPort}/profile-page.html</loc></url>
  <url><loc>http://127.0.0.1:${request.socket.localPort}/redirect-me</loc></url>
  <url><loc>http://127.0.0.1:${request.socket.localPort}/missing-page.html</loc></url>
</urlset>`);
        return;
      case '/':
        response.writeHead(200, { 'content-type': 'text/html' });
        response.end('<html><body>home</body></html>');
        return;
      case '/profile-page.html':
        response.writeHead(200, { 'content-type': 'text/html' });
        response.end('<html><body>profile</body></html>');
        return;
      case '/redirect-me':
        response.writeHead(302, { location: '/profile-page.html' });
        response.end();
        return;
      case '/missing-page.html':
        response.writeHead(404, { 'content-type': 'text/html' });
        response.end('<html><body>missing</body></html>');
        return;
      default:
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('not found');
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
