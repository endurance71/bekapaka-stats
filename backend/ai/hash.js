import { createHash } from 'node:crypto';
import { getPromptVersion } from './promptVersions.js';

/**
 * Stable SHA-256 hash for cache invalidation.
 * @param {unknown} value
 * @returns {string}
 */
export function hashPayload(value) {
  const json = JSON.stringify(value);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Hash wejścia analizy AI: payload + wersja promptu danego typu.
 * Zmiana promptu (podbicie wersji) unieważnia cache tak samo jak zmiana danych.
 * @param {string} type — match | player | scouting | briefing | pregame | play
 * @param {unknown} payload
 * @param {{ promptVersion?: string }} [options] — nadpisanie wersji (testy)
 * @returns {string}
 */
export function hashAiPayload(type, payload, options = {}) {
  return hashPayload({
    type,
    promptVersion: options.promptVersion ?? getPromptVersion(type),
    payload
  });
}
