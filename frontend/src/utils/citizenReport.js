export const CITIZEN_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const CITIZEN_PHOTO_ACCEPT = [...CITIZEN_PHOTO_TYPES].join(",");
export const MAX_CITIZEN_PHOTO_BYTES = 5 * 1024 * 1024;
export const CITIZEN_PHOTO_ERROR = "Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.";

export function validateCitizenPhoto(file) {
  if (!file) return "";
  return CITIZEN_PHOTO_TYPES.has(file.type) && file.size <= MAX_CITIZEN_PHOTO_BYTES
    ? ""
    : CITIZEN_PHOTO_ERROR;
}

export function selectCitizenPhoto(input, currentPreview, urlApi = URL) {
  const file = input.files?.[0] || null;
  if (currentPreview) urlApi.revokeObjectURL(currentPreview);
  const error = validateCitizenPhoto(file);
  if (error) {
    input.value = "";
    return { photo: null, preview: "", error };
  }
  return {
    photo: file,
    preview: file ? urlApi.createObjectURL(file) : "",
    error: "",
  };
}

export function buildCitizenReportFormData(form, FormDataClass = FormData) {
  const body = new FormDataClass();
  body.append("village_id", form.villageId);
  body.append("category", form.category);
  if (form.description) body.append("description", form.description);
  if (form.latitude != null) body.append("latitude", form.latitude);
  if (form.longitude != null) body.append("longitude", form.longitude);
  if (form.photo) body.append("photo", form.photo);
  return body;
}
