/** Business decisions stay unset until confirmed by the club. */
export const siteSettings = {
  clubName: 'BeKaPaKa Bobolice',
  organizationName: 'Bobolicki Klub Przyjaciół Koszykówki „Bekapaka”',
  // TODO: approve the proposed club-domain address; preserve the existing contact.
  contactEmail: process.env.SITE_CONTACT_EMAIL || 'kontakt@damianmotylinski.pl',
  associationKrs: process.env.SITE_ASSOCIATION_KRS || '',
  privacyUrl: process.env.SITE_PRIVACY_URL || '',
  // TODO: confirm partner tiers, primary partner, cooperation form and photo-removal procedure.
  cooperationFormUrl: process.env.SITE_COOPERATION_FORM_URL || '',
  photoRemovalUrl: process.env.SITE_PHOTO_REMOVAL_URL || '',
  partnersLevelsApproved: process.env.SITE_PARTNER_LEVELS_APPROVED === '1'
}
