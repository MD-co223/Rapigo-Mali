import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-secret-do-not-use-in-prod');
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isSuperAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(request?: Request): Promise<{ userId: string; role: string; isSuperAdmin: boolean } | null> {
  try {
    const reqHeaders = request ? request.headers : await headers();
    const authHeader = reqHeaders.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) return null;
    
    return {
      userId: payload.userId,
      role: payload.role,
      isSuperAdmin: payload.isSuperAdmin || false,
    };
  } catch {
    return null;
  }
}

export function requireAuth(request?: Request) {
  return getAuthUser(request);
}

export function requireAdmin(request?: Request) {
  return getAuthUser(request).then(auth => {
    if (!auth || (auth.role !== 'ADMIN' && !auth.isSuperAdmin)) return null;
    return auth;
  });
}

export function requireSuperAdmin(request?: Request) {
  return getAuthUser(request).then(auth => {
    if (!auth || !auth.isSuperAdmin) return null;
    return auth;
  });
}

export function requireRole(...roles: string[]) {
  return async (request?: Request) => {
    const auth = await getAuthUser(request);
    if (!auth || !roles.includes(auth.role)) return null;
    return auth;
  };
}