export const MAX_HISTORY_LENGTH = 20;

export function addToHistory(history: string[], prompt: string): string[] {
  const withoutDuplicate = history.filter((item) => item !== prompt);
  return [prompt, ...withoutDuplicate].slice(0, MAX_HISTORY_LENGTH);
}
