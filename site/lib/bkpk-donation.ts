/** Bezpośrednia darowizna na rachunek klubu BeKaPaKa. */
export const BKPK_DONATION = {
  organizationName: 'BEKAPAKA',
  bankAccountDisplay: '38 1090 2590 0000 0001 5548 5269',
  bankAccountCopy: '38109025900000000155485269',
  iban: 'PL38109025900000000155485269',
  bankName: 'Santander Bank Polska S.A.',
  transferTitle: 'darowizna',
} as const

/**
 * Payload QR zgodny ze standardem EPC (SEPA Credit Transfer) — obsługiwanym przez polskie aplikacje bankowe.
 */
export function buildDonationQrPayload(): string {
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    '',
    BKPK_DONATION.organizationName,
    BKPK_DONATION.iban,
    '',
    '',
    '',
    BKPK_DONATION.transferTitle,
    '',
  ].join('\n')
}
