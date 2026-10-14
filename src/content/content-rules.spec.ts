import { describe, expect, it } from 'vitest';
import {
  canMutatePiece,
  canReadPiece,
  containsBlockedKeyword,
  decidePublish,
  previewText,
  sanitizeHtml,
} from './content-rules.js';

describe('content visibility', () => {
  const piece = {
    status: 'published',
    visibility: 'private',
    authorId: 'author',
  };

  it('hides private and premium pieces from guests', () => {
    expect(canReadPiece(piece, 'guest', null)).toBe(false);
    expect(
      canReadPiece({ ...piece, visibility: 'premium' }, 'guest', null),
    ).toBe(false);
    expect(
      canReadPiece(
        { status: 'published', visibility: 'public', authorId: 'author' },
        'guest',
        null,
      ),
    ).toBe(true);
  });

  it('lets the owner and a superadmin read private work', () => {
    expect(canReadPiece(piece, 'reader', 'author')).toBe(true);
    expect(canReadPiece(piece, 'superadmin', 'admin')).toBe(true);
    expect(canReadPiece(piece, 'reader', 'other')).toBe(false);
  });

  it('lets only the author in writer mode, or a superadmin, edit', () => {
    expect(canMutatePiece('author', 'reader', 'author')).toBe(false);
    expect(canMutatePiece('author', 'writer', 'author')).toBe(true);
    expect(canMutatePiece('author', 'writer', 'other')).toBe(false);
    expect(canMutatePiece('author', 'superadmin', 'admin')).toBe(true);
  });
});

describe('publish policy', () => {
  it('stores drafts as private', () => {
    expect(
      decidePublish({
        requestedStatus: 'draft',
        requestedVisibility: 'public',
        plan: 'free',
        publishedThisMonth: 0,
        isSuperadmin: false,
        blocked: false,
        genre: 'Drama',
      }).visibility,
    ).toBe('private');
  });

  it('forces a free publish to public and reverts the sixth', () => {
    const fifth = decidePublish({
      requestedStatus: 'published',
      requestedVisibility: 'private',
      plan: 'free',
      publishedThisMonth: 4,
      isSuperadmin: false,
      blocked: false,
      genre: 'Drama',
    });
    expect(fifth).toMatchObject({
      status: 'published',
      visibility: 'public',
      countPublish: true,
    });
    const sixth = decidePublish({
      requestedStatus: 'published',
      requestedVisibility: 'public',
      plan: 'free',
      publishedThisMonth: 5,
      isSuperadmin: false,
      blocked: false,
      genre: 'Drama',
    });
    expect(sixth).toMatchObject({
      status: 'draft',
      visibility: 'private',
      countPublish: false,
      limitReached: true,
    });
  });

  it('lets a superadmin skip the cap and blocks keywords', () => {
    expect(
      decidePublish({
        requestedStatus: 'published',
        requestedVisibility: 'public',
        plan: 'free',
        publishedThisMonth: 99,
        isSuperadmin: true,
        blocked: false,
        genre: 'Drama',
      }).status,
    ).toBe('published');
    expect(
      decidePublish({
        requestedStatus: 'published',
        requestedVisibility: 'public',
        plan: 'pro',
        publishedThisMonth: 0,
        isSuperadmin: false,
        blocked: true,
        genre: 'Drama',
      }),
    ).toMatchObject({ status: 'draft', blocked: true });
    expect(containsBlockedKeyword('A banned phrase', ['Banned'])).toBe(true);
  });

  it('stores a short preview and strips scripts', () => {
    expect(previewText(`<p>${'word '.repeat(80)}</p>`).length).toBeLessThanOrEqual(
      220,
    );
    expect(sanitizeHtml('<p onclick="x">Hi</p><script>alert(1)</script>')).toBe(
      '<p>Hi</p>',
    );
  });
});
