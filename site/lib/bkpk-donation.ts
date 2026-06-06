/** Bezpośrednia darowizna na rachunek stowarzyszenia BeKaPaKa. */
export const BKPK_DONATION = {
  organizationName: 'BEKAPAKA',
  bankAccountDisplay: '38 1090 2590 0000 0001 5548 5269',
  bankAccountCopy: '38109025900000000155485269',
  iban: 'PL38109025900000000155485269',
  bankName: 'Erste Bank Polska S.A.',
  transferTitle: 'darowizna',
} as const

const QR_DELIMITER = '|'

/** Znaki dozwolone w polach standardu 2D ZBP (Rekomendacja ZBP v1.0). */
const QR_DISALLOWED_CHARS =
  /[^A-Za-z0-9 ,./\\\-@#&*¹æê³ñóœŸ¿¥ÆÊ£ÑŹÓŒąćęłńóśźżĄĆĘŁŃŚŻ¯_]/gu

/**
 * Przycina i czyści pole tekstowe zgodnie z limitem standardu 2D.
 */
function sanitizeQrField(value: string, maxLength: number): string {
  return value
    .trim()
    .replace(QR_DISALLOWED_CHARS, '')
    .slice(0, maxLength)
}

/**
 * Payload QR wg Rekomendacji Związku Banków Polskich (standard „2D”).
 * Obsługiwany przez „Zeskanuj i zapłać” w polskich aplikacjach bankowych.
 *
 * Pola: NIP|kraj|NRB|kwota w groszach|odbiorca|tytuł|direct debit|invoobill|rezerwa
 */
export function buildDonationQrPayload(): string {
  const amountInGrosze = '000000'

  const parts = [
    '',
    'PL',
    sanitizeQrField(BKPK_DONATION.bankAccountCopy, 26),
    amountInGrosze,
    sanitizeQrField(BKPK_DONATION.organizationName, 20),
    sanitizeQrField(BKPK_DONATION.transferTitle, 32),
    '',
    '',
    '',
  ]

  return parts.join(QR_DELIMITER)
}
