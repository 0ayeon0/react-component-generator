import type { GeneratedComponent } from '../types';

export const COMPONENTS_STORAGE_KEY = 'rcg:components';

export function reviveComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: String(item.id),
      prompt: String(item.prompt),
      code: String(item.code),
      createdAt: new Date(item.createdAt as string),
    }))
    .filter((item) => !Number.isNaN(item.createdAt.getTime()));
}
