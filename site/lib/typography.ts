/** Keep Polish one-letter words together with the word that follows them. */
export function bindPolishOrphans(text: string): string {
  return text.replace(/(^|[^\p{L}\p{N}])([aAiIoOuUwWzZ])[ \t\n]+(?=\S)/gu, '$1$2\u00a0')
}

export function bindTrailingPolishOrphan(text: string): string {
  return text.replace(/(^|[^\p{L}\p{N}])([aAiIoOuUwWzZ])[ \t\n]+$/u, '$1$2\u00a0')
}
