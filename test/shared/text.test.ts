import { describe, expect, it } from 'vitest';
import { capitalize, escapeHtml } from '../../src/shared/text';

describe('capitalize', () => {
  it('uppercases the first character and leaves the rest unchanged', () => {
    expect(capitalize('impure')).toBe('Impure');
    expect(capitalize('PURE')).toBe('PURE');
  });

  it('handles an empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes every HTML-sensitive character', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('leaves ordinary text unchanged', () => {
    expect(escapeHtml('Iron Ore · Pure')).toBe('Iron Ore · Pure');
  });

  it('escapes already-escaped entities once more', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
