import test from "node:test";
import assert from "node:assert/strict";
import { resolveGpsVehicleStates } from "../src/utils/gpsProcessor.js";

test("GPS loại xe đã xử lý khỏi chưa xử lý", () => {
  const records = [
    { vehicle: "51B12345", state: "unprocessed", headerDate: "2026-09-14" },
    { vehicle: "51B12345", state: "processed", headerDate: "2026-09-16" },
  ];
  const result = resolveGpsVehicleStates(records, "2026-09-20", false);
  assert.equal(result.processed.has("51B12345"), true);
  assert.equal(result.unprocessed.has("51B12345"), false);
});

test("GPS ưu tiên snapshot chưa xử lý ngày cuối", () => {
  const records = [
    { vehicle: "51B12345", state: "processed", headerDate: "2026-09-16" },
    { vehicle: "51B12345", state: "unprocessed", headerDate: "2026-09-20" },
  ];
  const result = resolveGpsVehicleStates(records, "2026-09-20", true);
  assert.equal(result.processed.has("51B12345"), false);
  assert.equal(result.unprocessed.has("51B12345"), true);
});
