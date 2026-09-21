import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSheetNames, matchSheetName, normalizeSchemaText } from "../src/utils/excelSchemaValidator.js";

test("normalizeSchemaText bỏ dấu và chuẩn hóa khoảng trắng", () => {
  assert.equal(normalizeSchemaText(" Sổ  theo dõi Định vị "), "SO THEO DOI DINH VI");
});

test("matchSheetName hỗ trợ alias và prefix", () => {
  assert.equal(matchSheetName("SỔ THEO DÕI 16 TUYẾN HCM", { name: "SỔ THEO DÕI 16 TUYẾN", aliases: ["SỔ THEO DÕI 16 TUYẾN HCM"] }), true);
  assert.equal(matchSheetName("M02 - 17.09", { prefix: "M02" }), true);
});

test("evaluateSheetNames báo đúng sheet thiếu", () => {
  const schema = { sheets: [{ name: "SỔ THEO DÕI BA" }, { name: "SỔ THEO DÕI VIETMAP" }] };
  const valid = evaluateSheetNames(["SỔ THEO DÕI BA", "SỔ THEO DÕI VIETMAP"], schema);
  assert.equal(valid.valid, true);
  const invalid = evaluateSheetNames(["SỔ THEO DÕI BA"], schema);
  assert.equal(invalid.valid, false);
  assert.deepEqual(invalid.missingSheets, ["SỔ THEO DÕI VIETMAP"]);
});


test("GSTT chấp nhận tên sheet tháng khi Excel bỏ dấu gạch chéo", async () => {
  const { REPORT_FILE_SCHEMAS } = await import("../src/utils/reportSchemas.js");
  const pattern = REPORT_FILE_SCHEMAS.gstt.dynamicSheetPattern;
  assert.equal(pattern.test("06/2026"), true);
  assert.equal(pattern.test("06.2026"), true);
  assert.equal(pattern.test("062026"), true);
  assert.equal(pattern.test("132026"), false);
});
