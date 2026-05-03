const noop = () => {};

export function useVoiceInput(
  _setText: (text: string) => void,
  _maxLength: number,
) {
  return { recording: false, available: false, start: noop, stop: noop };
}
