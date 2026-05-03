const noop = () => {};

export function useGoogleAuth(_onError: (msg: string) => void) {
  return { trigger: noop, loading: false, ready: false };
}
