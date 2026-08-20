import assert from "node:assert/strict";
import test from "node:test";

import { beginEvidencePhotoLoad, openEvidencePhotoViewer } from "../src/utils/evidencePhotoLifecycle.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("a stale evidence request cannot replace the currently selected report photo", async () => {
  const requests = new Map([["photo-a", deferred()], ["photo-b", deferred()]]);
  const loadedPaths = [];
  const revoked = [];
  let source = "previous-photo";
  const loadPhoto = (path) => {
    loadedPaths.push(path);
    return requests.get(path).promise;
  };
  const options = { loadPhoto, setSource: (value) => { source = value; }, revokeObjectUrl: (url) => revoked.push(url) };

  const stopA = beginEvidencePhotoLoad({ ...options, path: "photo-a" });
  assert.equal(source, "");
  stopA();
  const stopB = beginEvidencePhotoLoad({ ...options, path: "photo-b" });
  assert.deepEqual(loadedPaths, ["photo-a", "photo-b"]);

  requests.get("photo-a").resolve("blob:photo-a");
  await Promise.resolve();
  assert.equal(source, "");
  assert.deepEqual(revoked, ["blob:photo-a"]);

  requests.get("photo-b").resolve("blob:photo-b");
  await Promise.resolve();
  assert.equal(source, "blob:photo-b");

  stopB();
  assert.deepEqual(revoked, ["blob:photo-a", "blob:photo-b"]);
});

test("selecting a report without a photo clears the previous source", () => {
  let source = "blob:previous";
  let loadCalled = false;
  const stop = beginEvidencePhotoLoad({
    path: "",
    loadPhoto: () => { loadCalled = true; },
    setSource: (value) => { source = value; },
    revokeObjectUrl: () => {},
  });
  assert.equal(source, "");
  assert.equal(loadCalled, false);
  stop();
});
test("protected evidence viewer opens only the authenticated blob URL and revokes it", async () => {
  const openedWith = [];
  const loaded = [];
  const replaced = [];
  const revoked = [];
  let scheduled;
  const viewer = {
    opener: {},
    location: { replace: (url) => replaced.push(url) },
    close: () => {},
  };

  const opened = await openEvidencePhotoViewer({
    path: "/api/community-reports/CR-001/photo",
    signal: new AbortController().signal,
    loadPhoto: async (path) => {
      loaded.push(path);
      return "blob:protected-photo";
    },
    openWindow: (...args) => {
      openedWith.push(args);
      return viewer;
    },
    revokeObjectUrl: (url) => revoked.push(url),
    scheduleRevoke: (callback, delay) => { scheduled = { callback, delay }; },
  });

  assert.equal(opened, true);
  assert.deepEqual(openedWith, [["", "_blank"]]);
  assert.deepEqual(loaded, ["/api/community-reports/CR-001/photo"]);
  assert.deepEqual(replaced, ["blob:protected-photo"]);
  assert.equal(viewer.opener, null);
  assert.equal(scheduled.delay, 60_000);

  scheduled.callback();
  scheduled.callback();
  assert.deepEqual(revoked, ["blob:protected-photo"]);
});
