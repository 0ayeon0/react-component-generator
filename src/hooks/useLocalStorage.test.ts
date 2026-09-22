import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('저장된 값이 없으면 initialValue로 시작한다', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('localStorage에 이미 값이 있으면 그 값으로 초기화한다', () => {
    localStorage.setItem('key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('값을 갱신하면 localStorage에도 반영된다', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    act(() => {
      result.current[1]('updated-value');
    });

    expect(result.current[0]).toBe('updated-value');
    expect(localStorage.getItem('key')).toBe(JSON.stringify('updated-value'));
  });

  it('다른 key를 쓰는 두 훅은 서로 값에 영향을 주지 않는다', () => {
    const { result: a } = renderHook(() => useLocalStorage('key-a', 'a-default'));
    const { result: b } = renderHook(() => useLocalStorage('key-b', 'b-default'));

    act(() => {
      a.current[1]('a-updated');
    });

    expect(a.current[0]).toBe('a-updated');
    expect(b.current[0]).toBe('b-default');
  });
});
