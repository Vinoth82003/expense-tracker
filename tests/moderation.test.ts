import { describe, it, expect, afterEach } from 'vitest';
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

  it('allows finance terms that previously false-blocked (e.g. "credit card")', () => {
    expect(moderateMessage('I paid my credit card bill today').allowed).toBe(true);
  });
});

describe('Chat moderation — configured blacklist (CHAT_MODERATION_BLACKLIST)', () => {
  const original = process.env.CHAT_MODERATION_BLACKLIST;

  afterEach(() => {
    if (original === undefined) delete process.env.CHAT_MODERATION_BLACKLIST;
    else process.env.CHAT_MODERATION_BLACKLIST = original;
  });

  it('parses the JSON-array .env format and still blocks terms', () => {
    process.env.CHAT_MODERATION_BLACKLIST = JSON.stringify(['kill', 'hack', 'credit card']);
    expect(moderateMessage('I want to hack this account').allowed).toBe(false);
    expect(moderateMessage('wire me some money').allowed).toBe(true);
  });

  it('still supports the plain comma-separated format', () => {
    process.env.CHAT_MODERATION_BLACKLIST = 'hack, bomb';
    expect(moderateMessage('there is a bomb threat').allowed).toBe(false);
  });
});
