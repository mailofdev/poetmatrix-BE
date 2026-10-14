export function canComment(input: {
  signedIn: boolean;
  pieceAllows: boolean;
  globallyEnabled: boolean;
}): boolean {
  return input.signedIn && input.pieceAllows && input.globallyEnabled;
}

export function canDeleteComment(authorId: string, actorId: string): boolean {
  return authorId === actorId;
}

export function shouldCountView(input: {
  signedIn: boolean;
  alreadyViewed: boolean;
}): boolean {
  return input.signedIn && !input.alreadyViewed;
}

export function reportReasonAccepted(reason: string): boolean {
  const length = reason.trim().length;
  return length >= 3 && length <= 2000;
}

export function progressAccepted(percent: number): boolean {
  return Number.isFinite(percent) && percent >= 0 && percent <= 100;
}

export function challengeCredit(percent: number, alreadyCredited: boolean): boolean {
  return percent >= 90 && !alreadyCredited;
}
