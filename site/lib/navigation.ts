/** Kolejność sportowa: kibic najczęściej szuka meczu, tabeli i składu; potem treści i klubu. */
export const navItems = [
  { href: '/mecze', label: 'Mecze' },
  { href: '/tabela', label: 'Tabela' },
  { href: '/sklad', label: 'Skład' },
  { href: '/aktualnosci', label: 'Aktualności' },
  { href: '/sponsorzy', label: 'Partnerzy' },
  { href: '/klub', label: 'Klub' }
]

export function isBekapakaRow(name: string) {
  const n = name.toLowerCase()
  return n.includes('bekapaka') || n.includes('bobolice')
}
