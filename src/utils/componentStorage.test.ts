import { describe, it, expect } from 'vitest';
import { reviveComponents } from './componentStorage';

describe('reviveComponents', () => {
  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(reviveComponents(undefined)).toEqual([]);
    expect(reviveComponents(null)).toEqual([]);
    expect(reviveComponents('not-an-array')).toEqual([]);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(reviveComponents([])).toEqual([]);
  });

  it('createdAt 문자열을 Date 인스턴스로 변환한다', () => {
    const stored = [
      { id: '1', prompt: '프로필 카드', code: 'render(<div/>)', createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    const result = reviveComponents(stored);

    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].id).toBe('1');
    expect(result[0].prompt).toBe('프로필 카드');
    expect(result[0].code).toBe('render(<div/>)');
  });

  it('createdAt이 유효하지 않은 항목은 제외한다', () => {
    const stored = [
      { id: '1', prompt: 'A', code: 'code-a', createdAt: 'not-a-date' },
      { id: '2', prompt: 'B', code: 'code-b', createdAt: '2026-01-01T00:00:00.000Z' },
    ];

    const result = reviveComponents(stored);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
