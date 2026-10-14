import { describe, expect, it } from 'vitest';
import {
  canComment,
  canDeleteComment,
  challengeCredit,
  reportReasonAccepted,
  shouldCountView,
} from './engagement-rules.js';

describe('engagement rules', () => {
  it('allows one view per signed-in user', () => {
    expect(shouldCountView({ signedIn: false, alreadyViewed: false })).toBe(
      false,
    );
    expect(shouldCountView({ signedIn: true, alreadyViewed: false })).toBe(
      true,
    );
    expect(shouldCountView({ signedIn: true, alreadyViewed: true })).toBe(
      false,
    );
  });

  it('respects both comment switches and author-only delete', () => {
    expect(
      canComment({
        signedIn: true,
        pieceAllows: true,
        globallyEnabled: false,
      }),
    ).toBe(false);
    expect(
      canComment({
        signedIn: true,
        pieceAllows: false,
        globallyEnabled: true,
      }),
    ).toBe(false);
    expect(canDeleteComment('author', 'other')).toBe(false);
    expect(canDeleteComment('author', 'author')).toBe(true);
  });

  it('checks report length and a single challenge credit', () => {
    expect(reportReasonAccepted('no')).toBe(false);
    expect(reportReasonAccepted('spam')).toBe(true);
    expect(challengeCredit(90, false)).toBe(true);
    expect(challengeCredit(90, true)).toBe(false);
    expect(challengeCredit(89, false)).toBe(false);
  });
});
