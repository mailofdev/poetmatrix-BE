import { Plan, normalizePlan } from '../users/account-rules.js';

export const GENRES = [
  'Romance',
  'Thriller / Mystery',
  'Horror',
  'Science Fiction (Sci-Fi)',
  'Fantasy',
  'Historical',
  'Comedy / Humor',
  'Drama',
  'Self-Help / Motivational',
  'Non-Fiction / Informative',
] as const;

export const SUBGENRES: Record<(typeof GENRES)[number], string[]> = {
  Romance: ['Contemporary', 'Historical', 'Paranormal'],
  'Thriller / Mystery': ['Crime', 'Psychological', 'Cozy'],
  Horror: ['Gothic', 'Supernatural', 'Body'],
  'Science Fiction (Sci-Fi)': ['Space', 'Dystopian', 'Cyberpunk'],
  Fantasy: ['Epic', 'Urban', 'Mythic'],
  Historical: ['War', 'Period', 'Biographical'],
  'Comedy / Humor': ['Satire', 'Slapstick', 'Wit'],
  Drama: ['Family', 'Social', 'Tragedy'],
  'Self-Help / Motivational': ['Habits', 'Career', 'Mindset'],
  'Non-Fiction / Informative': ['Essay', 'Reportage', 'Explainer'],
};

export const ARTICLE_SUBTYPES = [
  'Essay',
  'Opinion',
  'Guide',
  'News',
  'Other',
] as const;

export const PLAN_CAP: Record<Plan, number | null> = {
  [Plan.Free]: 5,
  [Plan.Basic]: 50,
  [Plan.Pro]: null,
};

export function plainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function previewText(html: string): string {
  const text = plainText(html);
  return text.length <= 220 ? text : `${text.slice(0, 217).trimEnd()}...`;
}

export function readingMinutes(html: string): number {
  const words = plainText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const ALLOWED = new Set([
  'p',
  'br',
  'strong',
  'em',
  'a',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'video',
  'source',
]);

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED.has(name)) {
        return '';
      }
      if (match.startsWith('</')) {
        return `</${name}>`;
      }
      if (name === 'a') {
        const href = /href\s*=\s*['"]([^'"]+)['"]/i.exec(attrs);
        const safe = href && /^https?:\/\//i.test(href[1]) ? href[1] : '';
        return safe ? `<a href="${safe}" rel="noopener noreferrer">` : '<a>';
      }
      if (name === 'img') {
        const src = /src\s*=\s*['"]([^'"]+)['"]/i.exec(attrs);
        const safe = src && /^https?:\/\//i.test(src[1]) ? src[1] : '';
        return safe ? `<img src="${safe}" alt="">` : '';
      }
      return `<${name}>`;
    });
}

export function containsBlockedKeyword(
  text: string,
  keywords: string[],
): boolean {
  const haystack = text.toLowerCase();
  return keywords.some((word) => {
    const needle = word.trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
}

export type PublishDecision = {
  status: 'draft' | 'published';
  visibility: 'public' | 'private' | 'premium';
  countPublish: boolean;
  limitReached: boolean;
  blocked: boolean;
};

export function decidePublish(input: {
  requestedStatus: 'draft' | 'published';
  requestedVisibility: 'public' | 'private' | 'premium';
  plan: string;
  publishedThisMonth: number;
  isSuperadmin: boolean;
  blocked: boolean;
  genre?: string;
}): PublishDecision {
  if (input.requestedStatus !== 'published') {
    return {
      status: 'draft',
      visibility: 'private',
      countPublish: false,
      limitReached: false,
      blocked: false,
    };
  }
  if (!input.genre?.trim()) {
    return {
      status: 'draft',
      visibility: 'private',
      countPublish: false,
      limitReached: false,
      blocked: false,
    };
  }
  if (input.blocked) {
    return {
      status: 'draft',
      visibility: 'private',
      countPublish: false,
      limitReached: false,
      blocked: true,
    };
  }
  const plan = normalizePlan(input.plan);
  let visibility = input.requestedVisibility;
  if (plan === Plan.Free) {
    visibility = 'public';
  }
  if (!input.isSuperadmin) {
    const cap = PLAN_CAP[plan];
    if (cap !== null && input.publishedThisMonth >= cap) {
      return {
        status: 'draft',
        visibility: 'private',
        countPublish: false,
        limitReached: true,
        blocked: false,
      };
    }
  }
  return {
    status: 'published',
    visibility,
    countPublish: !input.isSuperadmin,
    limitReached: false,
    blocked: false,
  };
}

export function canReadPiece(
  piece: { status: string; visibility: string; authorId: string | null },
  actor: 'guest' | 'reader' | 'writer' | 'superadmin',
  userId: string | null,
): boolean {
  if (piece.status === 'published' && piece.visibility === 'public') {
    return true;
  }
  if (actor === 'superadmin') {
    return true;
  }
  return Boolean(userId && piece.authorId === userId && actor !== 'guest');
}

export function canMutatePiece(
  authorId: string | null,
  actor: 'guest' | 'reader' | 'writer' | 'superadmin',
  userId: string | null,
): boolean {
  if (actor === 'superadmin') {
    return true;
  }
  return actor === 'writer' && Boolean(userId) && authorId === userId;
}

export function editorFeatures(plan: string) {
  const normalized = normalizePlan(plan);
  return {
    formatting: true,
    links: true,
    images: normalized !== Plan.Free,
    tables: normalized !== Plan.Free,
    alignment: normalized !== Plan.Free,
    video: normalized === Plan.Pro,
    source: normalized === Plan.Pro,
    fullscreen: normalized === Plan.Pro,
  };
}

export const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const COVER_MAX_BYTES = 2 * 1024 * 1024;

export function coverAccepted(type: string, size: number): boolean {
  return COVER_TYPES.includes(type) && size > 0 && size <= COVER_MAX_BYTES;
}
