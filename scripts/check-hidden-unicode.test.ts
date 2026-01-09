import { describe, expect, it } from 'vitest';
import {
  getLineCol,
  getCharName,
  createHiddenUnicodePattern,
} from './check-hidden-unicode.mjs';

describe('check-hidden-unicode', () => {
  describe('getLineCol', () => {
    it('calculates line and column for first character', () => {
      const content = 'Hello world';
      const result = getLineCol(content, 0);
      
      expect(result.line).toBe(1);
      expect(result.col).toBe(1);
    });

    it('calculates line and column for character in middle of line', () => {
      const content = 'Hello world';
      const result = getLineCol(content, 6);
      
      expect(result.line).toBe(1);
      expect(result.col).toBe(7);
    });

    it('calculates line and column for multiline content', () => {
      const content = 'First line\nSecond line\nThird line';
      const result = getLineCol(content, 15); // 'n' in Second (position 5)
      
      expect(result.line).toBe(2);
      expect(result.col).toBe(5);
    });

    it('calculates line and column for character after newline', () => {
      const content = 'First\nSecond';
      const result = getLineCol(content, 6); // 'S' in Second
      
      expect(result.line).toBe(2);
      expect(result.col).toBe(1);
    });

    it('calculates line and column for third line', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = getLineCol(content, 14); // 'L' in Line 3
      
      expect(result.line).toBe(3);
      expect(result.col).toBe(1);
    });
  });

  describe('getCharName', () => {
    it('returns correct name for Zero Width Space', () => {
      const result = getCharName('\u200B');
      expect(result).toBe('U+200B (Zero Width Space)');
    });

    it('returns correct name for Left-to-Right Embedding', () => {
      const result = getCharName('\u202A');
      expect(result).toBe('U+202A (Left-to-Right Embedding)');
    });

    it('returns correct name for Right-to-Left Override', () => {
      const result = getCharName('\u202E');
      expect(result).toBe('U+202E (Right-to-Left Override)');
    });

    it('returns correct name for BOM', () => {
      const result = getCharName('\uFEFF');
      expect(result).toBe('U+FEFF (Zero Width No-Break Space (BOM))');
    });

    it('returns Unknown for unrecognized character', () => {
      const result = getCharName('A');
      expect(result).toBe('U+0041 (Unknown)');
    });
  });

  describe('createHiddenUnicodePattern', () => {
    it('creates a regex that matches hidden unicode characters', () => {
      const pattern = createHiddenUnicodePattern();
      
      expect(pattern).toBeInstanceOf(RegExp);
      expect(pattern.global).toBe(true);
    });

    it('matches Zero Width Space', () => {
      const pattern = createHiddenUnicodePattern();
      const text = 'Hello\u200Bworld';
      const matches = text.match(pattern);
      
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(1);
      expect(matches?.[0]).toBe('\u200B');
    });

    it('matches multiple hidden unicode characters', () => {
      const pattern = createHiddenUnicodePattern();
      const text = 'Test\u200B\u202A\u202Etext';
      const matches = text.match(pattern);
      
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(3);
    });

    it('does not match normal characters', () => {
      const pattern = createHiddenUnicodePattern();
      const text = 'Normal text without hidden unicode';
      const matches = text.match(pattern);
      
      expect(matches).toBeNull();
    });

    it('matches BOM character', () => {
      const pattern = createHiddenUnicodePattern();
      const text = '\uFEFFHello';
      const matches = text.match(pattern);
      
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(1);
      expect(matches?.[0]).toBe('\uFEFF');
    });

    it('matches all types of hidden unicode in one string', () => {
      const pattern = createHiddenUnicodePattern();
      // Include samples from each category
      const text = 'A\u200BB\u202AC\u2066D\uFEFFE';
      const matches = text.match(pattern);
      
      expect(matches).not.toBeNull();
      expect(matches?.length).toBe(4);
    });
  });

  describe('pattern creation', () => {
    it('creates fresh regex instances to avoid state issues', () => {
      const pattern1 = createHiddenUnicodePattern();
      const pattern2 = createHiddenUnicodePattern();
      
      // Test with pattern1
      const text = 'Test\u200Btext\u202Amore';
      pattern1.exec(text);
      
      // pattern2 should start fresh
      expect(pattern2.lastIndex).toBe(0);
      
      // Both patterns should find the same matches independently
      const matches1 = text.match(createHiddenUnicodePattern());
      const matches2 = text.match(createHiddenUnicodePattern());
      
      expect(matches1).toEqual(matches2);
    });
  });
});
