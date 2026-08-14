/**
 * Who is signed in. There is no auth in this product and no operator record to
 * read from, so this is a placeholder standing in for whoever holds the session
 * once there is one to ask.
 *
 * One module rather than a constant per screen: the sidebar's account row and
 * Home's greeting are the same person, and two hardcoded names drift apart the
 * first time one of them is edited.
 *
 * The portrait comes from DiceBear, seeded by the address so the same person
 * keeps the same face between reloads.
 */
export const ACCOUNT = {
  name: 'Amélie Laurent',
  email: 'amelie@ledelicieux.com',
  avatarUri: 'https://api.dicebear.com/9.x/avataaars/png?seed=amelie@ledelicieux.com&size=96',
}

/** What a colleague would call across the pass — the family name on its own. */
export const lastName = (name: string) => name.trim().split(' ').at(-1) ?? name
