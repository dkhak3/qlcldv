import test from "node:test";
import assert from "node:assert/strict";
import { getVietnameseZodiac, getCanChiYear } from "../src/utils/tet.js";

test("2027 là năm Dê/Mùi", () => {
  assert.equal(getVietnameseZodiac(2027).name, "Dê");
  assert.match(getCanChiYear(2027), /Mùi/);
});

test("2023 dùng Mèo theo con giáp Việt Nam", () => {
  assert.equal(getVietnameseZodiac(2023).name, "Mèo");
});
