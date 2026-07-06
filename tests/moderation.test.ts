import { describe, it, expect } from 'vitest';
import { moderateMessage } from '../lib/chat/moderation';

describe('Chat moderation', () => {
  it('blocks empty messages', () => {
    const result = moderateMessage('');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('empty');
  });

  it('blocks blacklisted terms', () => {
    const result = moderateMessage('I want to hack this account');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('contains_');
  });

  it('blocks long numeric strings like credit card numbers', () => {
    const result = moderateMessage('My card is 4111111111111111');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('contains_long_numeric');
  });

  it('allows safe messages', () => {
    const result = moderateMessage('What did I spend this month?');
    expect(result.allowed).toBe(true);
  });
});
