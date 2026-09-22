import test from "node:test";
import assert from "node:assert/strict";
import {
  CORE_REPORT_BOX_COUNT,
  DEFAULT_REPORT_BOXES,
  mergeCoreReportBoxConfig,
  resolveReportBoxPersistence,
} from "../src/data/reportBoxes.js";

test("có đủ 8 Box hệ thống", () => {
  assert.equal(CORE_REPORT_BOX_COUNT, 8);
});

test("cấu hình Firestore không được ghi đè route/slug của Box hệ thống", () => {
  const daily = DEFAULT_REPORT_BOXES.find(box => box.key === "daily-vehicle");
  const merged = mergeCoreReportBoxConfig(daily, {
    id: "daily-vehicle",
    key: "daily-vehicle",
    slug: "bao-cao-phuong-tien-hang-ngay",
    route: "/bao-cao/bao-cao-phuong-tien-hang-ngay",
    appearance: "pink",
    videoUrl: "https://drive.google.com/file/d/demo/view",
    hidden: false,
    system: true,
  });

  assert.equal(merged.route, "/bao-cao-phuong-tien-hang-ngay");
  assert.equal(merged.slug, "bao-cao-phuong-tien-hang-ngay");
  assert.equal(merged.appearance, "pink");
  assert.equal(merged.videoUrl, "https://drive.google.com/file/d/demo/view");
});

test("mọi Box hệ thống luôn lưu route chuyên dụng", () => {
  for (const box of DEFAULT_REPORT_BOXES) {
    const persistence = resolveReportBoxPersistence({
      ...box,
      route: `/bao-cao/${box.slug}`,
      system: false,
    });
    assert.equal(persistence.key, box.key);
    assert.equal(persistence.slug, box.slug);
    assert.equal(persistence.route, box.route);
    assert.equal(persistence.system, true);
  }
});

test("Box tự tạo vẫn dùng route động /bao-cao/<slug>", () => {
  const persistence = resolveReportBoxPersistence({
    key: "custom-demo",
    slug: "bao-cao-demo",
    route: "/duong-dan-khac",
    system: false,
  });
  assert.deepEqual(persistence, {
    key: "custom-demo",
    slug: "bao-cao-demo",
    route: "/bao-cao/bao-cao-demo",
    system: false,
  });
});
