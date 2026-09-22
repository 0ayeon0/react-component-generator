import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, validatePromptLength } from './validatePrompt';

describe('validatePromptLength', () => {
  it('길이 제한 이하이면 valid: true를 반환한다', () => {
    expect(validatePromptLength('안녕하세요')).toEqual({ valid: true });
  });

  it('정확히 500자이면 valid: true를 반환한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH);
    expect(validatePromptLength(prompt)).toEqual({ valid: true });
  });

  it('500자를 초과하면 valid: false와 에러 메시지를 반환한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    const result = validatePromptLength(prompt);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('프롬프트는 500자를 넘을 수 없습니다. (현재 501자)');
  });

  it('빈 문자열이면 valid: true를 반환한다', () => {
    expect(validatePromptLength('')).toEqual({ valid: true });
  });
});
