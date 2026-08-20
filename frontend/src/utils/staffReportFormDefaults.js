function pad(value) {
  return String(value).padStart(2, "0");
}

export function localDateTimeValue(date = new Date()) {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

export function createHealthReportDefaults(date = new Date()) {
  return {
    village_id: "", report_date: localDateTimeValue(date), diarrhoeal_cases: 0,
    vomiting_cases: 0, fever_cases: 0, suspected_acute_watery_diarrhoea_cases: 0,
    households_visited: 0, unusual_symptom_cluster: false, common_water_source: "",
    remarks: "", field_evidence_note: "",
  };
}

export function createWaterReportDefaults(date = new Date()) {
  return {
    village_id: "", water_source_name: "", inspection_date: localDateTimeValue(date),
    source_type: "COMMUNITY_WELL", ph: "", turbidity_ntu: "",
    residual_chlorine_mg_l: "", bacterial_contamination_result: "NOT_TESTED",
    infrastructure_condition: "", remarks: "", field_evidence_note: "",
  };
}
