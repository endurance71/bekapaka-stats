import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const studioDir = path.dirname(fileURLToPath(import.meta.url));
export const brandDir = path.join(studioDir, 'brand');
export const storageDir = path.resolve(process.env.STUDIO_STORAGE_DIR || path.join(studioDir, '../../data/studio'));
export const ownerId = () => process.env.STUDIO_OWNER_ID || '';
export const origin = () => process.env.STUDIO_ORIGIN || 'http://localhost:5174';
export const cookieName = process.env.NODE_ENV === 'production' ? '__Host-bkpk-studio' : 'bkpk-studio';
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 12 * 3600_000 });
export class StudioError extends Error { constructor(status, message, details) { super(message); this.status = status; this.details = details; } }
export const fail = (status, message, details) => { throw new StudioError(status, message, details); };
