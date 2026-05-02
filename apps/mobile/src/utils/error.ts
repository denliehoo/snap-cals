export function getErrorMessage(e: unknown, fallback = "Something went wrong") {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return fallback;
}
