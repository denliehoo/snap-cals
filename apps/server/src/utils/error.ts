export function getErrorMessage(e: unknown, fallback = "Something went wrong") {
  return e instanceof Error ? e.message : fallback;
}
