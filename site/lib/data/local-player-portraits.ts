/** AI portrait variants for the explicitly enabled localhost preview. Original assets stay intact. */
const portraits: Readonly<Record<string, { number: string; photo: string }>> = {
  '08a918a8-2643-436d-9812-f6ffe7d90b52': { number: '3', photo: '/brand/photography/pawel-samusionek-portret-v1.png' },
  '428899fd-f115-48da-be46-67e3d401f075': { number: '4', photo: '/brand/photography/pablo-iriarte-portret-v1.png' },
  'e25fcddf-07eb-417c-b3d0-9893dbe506d9': { number: '7', photo: '/brand/photography/patryk-szczesniak-portret-v1.png' },
  '4e1f208b-c0fa-40a0-9f8a-3d5a83cb0c4f': { number: '11', photo: '/brand/photography/miroslaw-malina-portret-v1.png' },
  '7ecbfdcc-c83e-4e55-800a-ae9a8e654cee': { number: '16', photo: '/brand/photography/przemyslaw-klimek-portret-v1.png' },
  '5b93fd48-790e-44ba-bfaa-f4e754b09b0b': { number: '21', photo: '/brand/photography/robert-kulik-portret-v1.png' },
  '1a13d025-0978-4640-8568-2bc4b4c9a2ef': { number: '23', photo: '/brand/photography/emil-klos-portret-v1.png' },
  '32b52081-2a59-4319-90df-6ebc91e8a210': { number: '69', photo: '/brand/photography/filip-karpinski-portret-v1.png' },
  '30ed3c7c-f2c6-498b-952f-5b97c409a47a': { number: '77', photo: '/brand/photography/filip-kawecki-portret-v1.png' },
  '6e4b3066-85ba-4448-9d88-1437c68f8b05': { number: '12', photo: '/brand/photography/tomasz-kaszubowski-portret-v3.png' }
}

/** Match identity and jersey number; an unknown player or changed number keeps their source photo. */
export function resolveLocalPlayerPortrait(player: { id: string; number?: string | null }, enabled = false): string | undefined {
  if (!enabled) return undefined
  const portrait = portraits[player.id]
  return portrait && player.number?.trim() === portrait.number ? portrait.photo : undefined
}
