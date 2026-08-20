export function representativePhotoAttribution(report) {
  return report?.photo_url && report.representative_photo_report_id
    ? `Photo evidence from ${report.representative_photo_report_id}`
    : "";
}
