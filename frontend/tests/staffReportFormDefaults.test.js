import assert from "node:assert/strict";
import test from "node:test";

import {
  createHealthReportDefaults,
  createWaterReportDefaults,
  localDateTimeValue,
} from "../src/utils/staffReportFormDefaults.js";

function nonUtcLocalDate() {
  return {
    getFullYear: () => 2026,
    getMonth: () => 7,
    getDate: () => 20,
    getHours: () => 15,
    getMinutes: () => 7,
    getTimezoneOffset: () => -330,
    toISOString: () => { throw new Error("datetime-local defaults must not use UTC ISO conversion"); },
  };
}

test("datetime-local defaults use local wall-clock components without UTC shifting", () => {
  assert.equal(localDateTimeValue(nonUtcLocalDate()), "2026-08-20T15:07");
});

test("ASHA and Water Worker forms use the same correct local default", () => {
  const localDate = nonUtcLocalDate();
  const health = createHealthReportDefaults(localDate);
  const water = createWaterReportDefaults(localDate);
  assert.equal(health.report_date, "2026-08-20T15:07");
  assert.equal(water.inspection_date, "2026-08-20T15:07");
});

test("user-edited datetime-local values remain unchanged in form state", () => {
  const health = { ...createHealthReportDefaults(nonUtcLocalDate()), report_date: "2026-09-01T16:45" };
  const water = { ...createWaterReportDefaults(nonUtcLocalDate()), inspection_date: "2026-09-02T08:15" };
  assert.equal(health.report_date, "2026-09-01T16:45");
  assert.equal(water.inspection_date, "2026-09-02T08:15");
});
