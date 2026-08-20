export async function settleAbortableRequest(request, signal) {
  try {
    const value = await request(signal);
    return signal?.aborted ? { aborted: true } : { aborted: false, value };
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") return { aborted: true };
    throw error;
  }
}
