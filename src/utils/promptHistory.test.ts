import { describe, it, expect } from 'vitest';
import { MAX_HISTORY_LENGTH, addToHistory } from './promptHistory';

describe('addToHistory', () => {
  it('빈 히스토리에 추가하면 새 프롬프트가 유일한 항목이 된다', () => {
    expect(addToHistory([], '프로필 카드')).toEqual(['프로필 카드']);
  });

  it('새 프롬프트는 맨 앞에 추가된다', () => {
    expect(addToHistory(['이전 프롬프트'], '새 프롬프트')).toEqual(['새 프롬프트', '이전 프롬프트']);
  });

  it('이미 있는 프롬프트를 다시 추가하면 중복 없이 맨 앞으로 이동한다', () => {
    const history = ['A', 'B', 'C'];
    expect(addToHistory(history, 'B')).toEqual(['B', 'A', 'C']);
  });

  it(`${MAX_HISTORY_LENGTH}개를 초과하면 가장 오래된 항목을 제거한다`, () => {
    const history = Array.from({ length: MAX_HISTORY_LENGTH }, (_, i) => `prompt-${i}`);
    const result = addToHistory(history, 'new-prompt');

    expect(result).toHaveLength(MAX_HISTORY_LENGTH);
    expect(result[0]).toBe('new-prompt');
    expect(result).not.toContain(`prompt-${MAX_HISTORY_LENGTH - 1}`);
  });
});
