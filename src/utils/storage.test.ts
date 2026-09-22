import { describe, it, expect, vi } from 'vitest';
import { readLocalStorage, writeLocalStorage } from './storage';

describe('readLocalStorage', () => {
  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(readLocalStorage('missing-key', 'fallback')).toBe('fallback');
  });

  it('저장된 값이 있으면 파싱해서 반환한다', () => {
    localStorage.setItem('key', JSON.stringify({ a: 1 }));
    expect(readLocalStorage('key', {})).toEqual({ a: 1 });
  });

  it('손상된 JSON이 저장돼 있으면 fallback을 반환한다', () => {
    localStorage.setItem('key', '{not valid json');
    expect(readLocalStorage('key', 'fallback')).toBe('fallback');
  });
});

describe('writeLocalStorage', () => {
  it('값을 JSON으로 직렬화해 저장한다', () => {
    writeLocalStorage('key', { a: 1 });
    expect(localStorage.getItem('key')).toBe(JSON.stringify({ a: 1 }));
  });

  it('localStorage.setItem이 에러를 던져도 조용히 무시한다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => writeLocalStorage('key', 'value')).not.toThrow();

    spy.mockRestore();
  });
});
