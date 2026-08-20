import assert from "node:assert/strict";
import test from "node:test";

import { settleAbortableRequest } from "../src/utils/requestLifecycle.js";

test("an aborted request cannot publish a late successful result", async () => {
  const controller = new AbortController();
  let resolveRequest;
  const pendingValue = new Promise((resolve) => { resolveRequest = resolve; });
  const pendingResult = settleAbortableRequest(() => pendingValue, controller.signal);

  controller.abort();
  resolveRequest(["stale report"]);

  assert.deepEqual(await pendingResult, { aborted: true });
});

test("non-abort request failures still reach the page error state", async () => {
  await assert.rejects(
    settleAbortableRequest(async () => { throw new Error("backend unavailable"); }),
    /backend unavailable/,
  );
});

test("an uncancelled retry publishes its successful result", async () => {
  assert.deepEqual(
    await settleAbortableRequest(async () => ["current report"]),
    { aborted: false, value: ["current report"] },
  );
});
