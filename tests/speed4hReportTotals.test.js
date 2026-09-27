import test from "node:test";
import assert from "node:assert/strict";
import { countNoAnswerEmployeeNames } from "../src/utils/speed4hReportTotals.js";

test("Tốc độ 4H đếm số lượng tên nhân viên không nghe máy", () => {
  assert.equal(countNoAnswerEmployeeNames([]), 0);
  assert.equal(countNoAnswerEmployeeNames([
    { noAnswerEmployee: "" },
    { noAnswerEmployee: null },
  ]), 0);

  assert.equal(countNoAnswerEmployeeNames([
    { noAnswerEmployee: "Nguyễn Hữu Duy Kha" },
  ]), 1);

  assert.equal(countNoAnswerEmployeeNames([
    { noAnswerEmployee: "Nguyễn Hữu Duy Kha" },
    { noAnswerEmployee: "Trần Văn Lành" },
  ]), 2);
});

test("Tốc độ 4H đếm đủ nhiều tên được gộp trong cùng một ô", () => {
  assert.equal(countNoAnswerEmployeeNames([
    { noAnswerEmployee: "Nguyễn Văn A, Trần Văn B" },
    { noAnswerEmployee: "Lê Văn C" },
    { noAnswerEmployee: "   " },
  ]), 3);
});
