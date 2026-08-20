import assert from "node:assert/strict";
import test from "node:test";

import {
  CITIZEN_PHOTO_ACCEPT,
  CITIZEN_PHOTO_ERROR,
  MAX_CITIZEN_PHOTO_BYTES,
  buildCitizenReportFormData,
  selectCitizenPhoto,
  validateCitizenPhoto,
} from "../src/utils/citizenReport.js";

class RecordingFormData {
  constructor() { this.values = new Map(); }
  append(key, value) { this.values.set(key, value); }
  get(key) { return this.values.get(key); }
  has(key) { return this.values.has(key); }
}

test("citizen photo validation matches the backend multipart allowlist", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"]) {
    assert.equal(validateCitizenPhoto({ type, size: MAX_CITIZEN_PHOTO_BYTES }), "");
    assert.match(CITIZEN_PHOTO_ACCEPT, new RegExp(type));
  }

  assert.equal(validateCitizenPhoto({ type: "image/heic", size: 1024 }), CITIZEN_PHOTO_ERROR);
  assert.equal(validateCitizenPhoto({ type: "image/svg+xml", size: 1024 }), CITIZEN_PHOTO_ERROR);
  assert.equal(
    validateCitizenPhoto({ type: "image/png", size: MAX_CITIZEN_PHOTO_BYTES + 1 }),
    CITIZEN_PHOTO_ERROR,
  );
});

test("rejecting a selected photo clears the native input and submission payload", () => {
  const invalidPhoto = { name: "capture.heic", type: "image/heic", size: 1024 };
  const input = { files: [invalidPhoto], value: "C:\\fakepath\\capture.heic" };
  const revoked = [];
  const selection = selectCitizenPhoto(input, "blob:invalid-preview", {
    revokeObjectURL: (value) => revoked.push(value),
    createObjectURL: () => { throw new Error("invalid files must not receive previews"); },
  });

  assert.equal(input.value, "");
  assert.equal(selection.photo, null);
  assert.equal(selection.preview, "");
  assert.equal(selection.error, CITIZEN_PHOTO_ERROR);
  assert.deepEqual(revoked, ["blob:invalid-preview"]);

  const body = buildCitizenReportFormData(
    { villageId: "ASM-CCH-001", category: "FLOODED_AREA", photo: selection.photo },
    RecordingFormData,
  );
  assert.equal(body.has("photo"), false);
});

test("a valid replacement photo is submitted and no-photo submission remains allowed", () => {
  const validPhoto = { name: "evidence.png", type: "image/png", size: 2048 };
  const input = { files: [validPhoto], value: "C:\\fakepath\\evidence.png" };
  const selection = selectCitizenPhoto(input, "", {
    revokeObjectURL: () => {},
    createObjectURL: () => "blob:valid-preview",
  });

  assert.equal(selection.photo, validPhoto);
  assert.equal(selection.preview, "blob:valid-preview");
  assert.equal(selection.error, "");

  const withPhoto = buildCitizenReportFormData(
    { villageId: "ASM-CCH-001", category: "FLOODED_AREA", photo: selection.photo },
    RecordingFormData,
  );
  assert.equal(withPhoto.get("photo"), validPhoto);

  const withoutPhoto = buildCitizenReportFormData(
    { villageId: "ASM-CCH-001", category: "FLOODED_AREA", photo: null },
    RecordingFormData,
  );
  assert.equal(withoutPhoto.has("photo"), false);
});
