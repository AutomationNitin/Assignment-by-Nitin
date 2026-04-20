const http = require('node:http');

const { test, expect } = require('@playwright/test');
const { fetchSitemapUrls } = require('../src/sitemap');
const { runHealthCheck } = require('../src/health-checker');
const { categorizeStatus, derivePageName } = require('../src/url-checker');

test.describe('sitemap health checker', () => {
  test('derives page names and categories correctly', async () => {
    expect(derivePageName('https://example.com/')).toBe('Homepage');
    expect(derivePageName('https://example.com/profile-page.html')).toBe('Profile Page');
    expect(categorizeStatus(200)).toBe('Healthy');
    expect(categorizeStatus(302)).toBe('Redirected');
    expect(categorizeStatus(404)).toBe('Broken');
  });

  test('reads nested sitemaps and builds a summary report', async () => {
    const server = createFixtureServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const sitemapUrl = `http://127.0.0.1:${port}/sitemap.xml`;
      const urls = await fetchSitemapUrls(sitemapUrl, { timeoutMs: 5000, maxUrls: 0 });
      expect(urls).toHaveLength(3);

      const report = await runHealthCheck({
        sitemapUrl,
        concurrency: 3,
        timeoutMs: 5000,
        retries: 0,
        maxUrls: 0,
      });

      expect(report.summary.totalUrls).toBe(3);
      expect(report.summary.healthyCount).toBe(1);
      expect(report.summary.redirectedCount).toBe(1);
      expect(report.summary.brokenCount).toBe(1);
    } finally {
      server.close();
    }
  });
});

function createFixtureServer() {
  return http.createServer((request, response) => {
    switch (request.url) {
      case '/sitemap.xml':
        response.writeHead(200, { 'content-type': 'application/xml' });
        response.end(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>http://127.0.0.1:${request.socket.localPort}/nested.xml</loc></sitemap>
</sitemapindex>`);
        return;
      case '/nested.xml':
        response.writeHead(200, { 'content-type': 'application/xml' });
        response.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://127.0.0.1:${request.socket.localPort}/ok</loc></url>
  <url><loc>http://127.0.0.1:${request.socket.localPort}/moved</loc></url>
  <url><loc>http://127.0.0.1:${request.socket.localPort}/bad</loc></url>
</urlset>`);
        return;
      case '/ok':
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('ok');
        return;
      case '/moved':
        response.writeHead(301, { location: '/ok' });
        response.end();
        return;
      case '/bad':
        response.writeHead(500, { 'content-type': 'text/plain' });
        response.end('bad');
        return;
      default:
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('missing');
    }
  });
}
