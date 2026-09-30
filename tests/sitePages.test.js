import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SITE_PAGES } from "../src/data/sitePages.js";

test("Tuyến được quản lý trong Quản lý trang & slug", () => {
  const page = DEFAULT_SITE_PAGES.find(item => item.key === "routes");
  assert.ok(page);
  assert.equal(page.title, "Tuyến");
  assert.equal(page.slug, "tuyen");
  assert.equal(page.hidden, false);
  assert.deepEqual(page.roles, ["user", "admin", "superadmin"]);
});

test("slug mặc định của các trang quản lý không bị trùng", () => {
  const slugs = DEFAULT_SITE_PAGES.map(item => item.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});
