import assert from "node:assert/strict";
import test from "node:test";

import { representativePhotoAttribution } from "../src/utils/communityReportPresentation.js";

test("representative cluster evidence is attributed to its supplying report", () => {
  const cluster = {
    id: "CR-A",
    cluster_id: "INC-001",
    photo_url: "/api/community-reports/CR-B/photo",
    representative_photo_report_id: "CR-B",
  };

  assert.equal(cluster.id, "CR-A");
  assert.equal(representativePhotoAttribution(cluster), "Photo evidence from CR-B");
});
