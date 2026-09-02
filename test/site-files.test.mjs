import assert from "node:assert/strict";
import test from "node:test";
import { parseSitemap, sitemapsFromRobots } from "../lib/site-files.mjs";

test("D3: lê todas as linhas Sitemap: do robots", () => {
  const robots = "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\nsitemap: /courses-sitemap.xml\n";
  assert.deepEqual(sitemapsFromRobots(robots, "https://example.com"), [
    "https://example.com/sitemap.xml",
    "https://example.com/courses-sitemap.xml"
  ]);
});

test("D3: sem robots usa /sitemap.xml", () => {
  assert.deepEqual(sitemapsFromRobots("", "https://example.com"), ["https://example.com/sitemap.xml"]);
});

test("D3: reconhece sitemapindex e conta lastmod", () => {
  const index = parseSitemap('<?xml version="1.0"?><sitemapindex><sitemap><loc>https://example.com/a.xml</loc></sitemap></sitemapindex>');
  assert.equal(index.isIndex, true);
  assert.deepEqual(index.locations, ["https://example.com/a.xml"]);
  const urlset = parseSitemap("<urlset><url><loc>https://example.com/</loc><lastmod>2026-09-01</lastmod></url><url><loc>https://example.com/b</loc></url></urlset>");
  assert.equal(urlset.isIndex, false);
  assert.equal(urlset.locations.length, 2);
  assert.equal(urlset.lastModified.length, 1);
});
