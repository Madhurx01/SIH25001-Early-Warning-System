export function beginEvidencePhotoLoad({ path, signal, loadPhoto, setSource, revokeObjectUrl }) {
  let active = true;
  let ownedObjectUrl = "";
  setSource("");

  if (path) {
    loadPhoto(path, signal)
      .then((objectUrl) => {
        if (!active) {
          revokeObjectUrl(objectUrl);
          return;
        }
        ownedObjectUrl = objectUrl;
        setSource(objectUrl);
      })
      .catch(() => {
        if (active) setSource("");
      });
  }

  return () => {
    active = false;
    if (ownedObjectUrl) revokeObjectUrl(ownedObjectUrl);
  };
}

export async function openEvidencePhotoViewer({
  path,
  signal,
  loadPhoto,
  openWindow = (...args) => globalThis.window?.open(...args),
  revokeObjectUrl = globalThis.URL.revokeObjectURL,
  scheduleRevoke = globalThis.setTimeout,
}) {
  const viewer = openWindow("", "_blank");
  if (!viewer) throw new Error("Allow pop-ups to view protected evidence.");
  viewer.opener = null;

  let objectUrl = "";
  try {
    objectUrl = await loadPhoto(path, signal);
    if (signal?.aborted) {
      revokeObjectUrl(objectUrl);
      viewer.close?.();
      return false;
    }

    viewer.location.replace(objectUrl);
    let revoked = false;
    scheduleRevoke(() => {
      if (revoked) return;
      revoked = true;
      revokeObjectUrl(objectUrl);
    }, 60_000);
    return true;
  } catch (error) {
    if (objectUrl) revokeObjectUrl(objectUrl);
    viewer.close?.();
    throw error;
  }
}
