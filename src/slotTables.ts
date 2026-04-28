export interface SlotTableDef {
  /** URL slug used by react-router. */
  slug: string;
  /** Short label for the top nav. */
  shortName: string;
  /** Full title shown on the page. */
  title: string;
  /** OSRS Wiki page name (use underscores) to fetch via the MediaWiki API. */
  wikiPage: string;
  /** Default set of column header names that should be summed. */
  defaultSumColumns: string[];
}

/**
 * The slot tables we mirror. Excludes:
 *   - F2P variants (e.g. "One-handed slot table (F2P)")
 *   - Combat-only pure variants (under "Combat only pure/...")
 *   - Ultimate Ironman variants (under "Ultimate Ironman Guide/...")
 */
export const SLOT_TABLES: SlotTableDef[] = [
  {
    slug: 'ammunition',
    shortName: 'Ammunition',
    title: 'Ammunition slot table',
    wikiPage: 'Ammunition_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'body',
    shortName: 'Body',
    title: 'Body slot table',
    wikiPage: 'Body_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'cape',
    shortName: 'Cape',
    title: 'Cape slot table',
    wikiPage: 'Cape_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'feet',
    shortName: 'Feet',
    title: 'Feet slot table',
    wikiPage: 'Feet_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'hands',
    shortName: 'Hands',
    title: 'Hands slot table',
    wikiPage: 'Hands_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'head',
    shortName: 'Head',
    title: 'Head slot table',
    wikiPage: 'Head_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'legs',
    shortName: 'Legs',
    title: 'Legs slot table',
    wikiPage: 'Legs_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'neck',
    shortName: 'Neck',
    title: 'Neck slot table',
    wikiPage: 'Neck_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'one-handed',
    shortName: 'One-handed',
    title: 'One-handed slot table',
    wikiPage: 'One-handed_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'ring',
    shortName: 'Ring',
    title: 'Ring slot table',
    wikiPage: 'Ring_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'shield',
    shortName: 'Shield',
    title: 'Shield slot table',
    wikiPage: 'Shield_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'two-handed',
    shortName: 'Two-handed',
    title: 'Two-handed slot table',
    wikiPage: 'Two-handed_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
  {
    slug: 'weapon',
    shortName: 'Weapon',
    title: 'Weapon slot table',
    wikiPage: 'Weapon_slot_table',
    defaultSumColumns: ['Stab', 'Slash', 'Crush', 'Magic', 'Ranged'],
  },
];

export function findSlotTable(slug: string): SlotTableDef | undefined {
  return SLOT_TABLES.find((t) => t.slug === slug);
}
