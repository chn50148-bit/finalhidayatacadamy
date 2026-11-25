import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById, updateUser, type UserRecord } from '../db/repository.ts';

const JWT_SECRET =
  process.env.JWT_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

export interface AuthenticatedRequest extends Request {
  authUser?: UserRecord;
}

export function signAuthToken(user: UserRecord): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function syncTrialLockState(user: UserRecord): Promise<UserRecord> {
  if (user.accessStatus === 'active') {
    return user;
  }
  const trialExpired = Date.now() > new Date(user.trialEndsAt).getTime();
  if (trialExpired && user.accessStatus !== 'locked') {
    const updated = await updateUser(user.id, { accessStatus: 'locked' });
    return updated ?? { ...user, accessStatus: 'locked' };
  }
  return user;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    if (!payload.sub || typeof payload.sub !== 'string') {
      res.status(401).json({ error: 'Invalid session token.' });
      return;
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'Student account not found.' });
      return;
    }

    req.authUser = await syncTrialLockState(user);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

export function requireUnlockedAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (user.accessStatus === 'locked') {
    res.status(403).json({
      code: 'DASHBOARD_LOCKED',
      error:
        'Your 3-day free trial has ended. Please select a course plan and pay your monthly fee to unlock classes.',
    });
    return;
  }
  next();
}
