const MIN_JWT_SECRET_LENGTH = 32;

/**
 * @returns {boolean}
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * @param {string} name
 * @returns {string | undefined}
 */
export function getOptionalEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return undefined;
  }
  return value;
}

/**
 * @param {string} name
 * @param {{ minLength?: number }} [options]
 * @returns {string}
 */
export function requireEnv(name, options = {}) {
  const value = getOptionalEnv(name);
  const minLength = options.minLength ?? 1;

  if (!value || value.length < minLength) {
    throw new Error(
      `${name} is required${minLength > 1 ? ` (min ${minLength} characters)` : ''}. Set it in the environment.`
    );
  }

  return value;
}

/**
 * JWT signing secret — required in production; in dev must be set via .env (no hardcoded fallback).
 * @returns {string}
 */
export function getJwtSecret() {
  const secret = getOptionalEnv('JWT_SECRET');

  if (isProduction()) {
    if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET is required in production (min ${MIN_JWT_SECRET_LENGTH} characters).`
      );
    }
    return secret;
  }

  if (!secret) {
    throw new Error(
      'JWT_SECRET is required. For local dev set JWT_SECRET in backend/.env (e.g. dev-only-change-me-32-chars-min).'
    );
  }

  return secret;
}

/**
 * @param {string} name
 * @param {number} [minLength]
 * @returns {string | undefined}
 */
export function getEnvMinLength(name, minLength = 12) {
  const value = getOptionalEnv(name);
  if (!value || value.length < minLength) {
    return undefined;
  }
  return value;
}
