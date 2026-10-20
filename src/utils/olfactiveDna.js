const ACCORD_FAMILIES = {
  Citrus: ['Bergamot', 'Lemon', 'Mandarin', 'Grapefruit', 'Lime', 'Orange', 'Petitgrain', 'Neroli', 'Citron'],
  Woody: ['Cedar', 'Sandalwood', 'Vetiver', 'Patchouli', 'Oud', 'Guaiac Wood', 'Akigalawood', 'Oak', 'Cypress', 'Birch'],
  'Warm Spicy': ['Cardamom', 'Cinnamon', 'Pepper', 'Nutmeg', 'Cloves', 'Saffron', 'Spices'],
  Gourmand: ['Vanilla', 'Tonka Bean', 'Coffee', 'Chocolate', 'Honey', 'Praline', 'Caramel', 'Cacao', 'Almond', 'Cognac', 'Rum'],
  Aromatic: ['Lavender', 'Mint', 'Sage', 'Rosemary', 'Thyme', 'Basil', 'Geranium', 'Artemisia'],
  Amber: ['Ambroxan', 'Amber', 'Ambergris', 'Labdanum', 'Benzoin', 'Opoponax', 'Incense', 'Fir Resin'],
  Floral: ['Jasmine', 'Rose', 'Iris', 'Violet', 'Orange Blossom', 'Ylang-Ylang', 'Peony', 'Lily-of-the-Valley', 'Osmanthus'],
  Fruity: ['Pineapple', 'Apple', 'Blackcurrant', 'Pear', 'Plum', 'Cherry', 'Melon', 'Peach', 'Lychee', 'Fruity Notes'],
  Marine: ['Sea Notes', 'Aquozone', 'Mineral Notes', 'Sea Salt', 'Seaweed'],
  Leather: ['Leather', 'Suede', 'Birch', 'Styrax']
};

/**
 * Calculates note frequencies and dominant accords from a list of saved bottles.
 */
export function analyzeWardrobe(bottles = []) {
  if (!bottles || bottles.length === 0) {
    return {
      totalBottles: 0,
      dominantNotes: [],
      dominantAccords: [],
      archetype: 'Unaligned Nose',
      description: 'Save bottles to your shelf to synthesize your olfactive signature.'
    };
  }

  const noteCounts = {};
  const accordCounts = {};

  bottles.forEach((bottle) => {
    const uniqueNotesInBottle = new Set((bottle.notes || []).map((n) => n.trim()));

    uniqueNotesInBottle.forEach((note) => {
      // Tally note frequency
      noteCounts[note] = (noteCounts[note] || 0) + 1;

      // Classify into accord families
      for (const [accord, keywords] of Object.entries(ACCORD_FAMILIES)) {
        if (keywords.some((kw) => kw.toLowerCase() === note.toLowerCase())) {
          accordCounts[accord] = (accordCounts[accord] || 0) + 1;
        }
      }
    });
  });

  // Calculate percentages
  const total = bottles.length;

  const dominantNotes = Object.entries(noteCounts)
    .map(([note, count]) => ({
      note,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dominantAccords = Object.entries(accordCounts)
    .map(([accord, count]) => ({
      accord,
      count,
      percentage: Math.min(100, Math.round((count / total) * 100))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Generate Archetype Name based on top 2 accords
  const top1 = dominantAccords[0]?.accord || 'Fresh';
  const top2 = dominantAccords[1]?.accord || 'Woody';

  let archetype = `${top1} ${top2} Connoisseur`;
  if (top1 === 'Woody' && top2 === 'Amber') archetype = 'Resinous Wood Alchemist';
  if (top1 === 'Citrus' && top2 === 'Woody') archetype = 'Modern Chypre Purist';
  if (top1 === 'Gourmand' || top2 === 'Gourmand') archetype = 'Velvet Gourmand Nomad';
  if (top1 === 'Warm Spicy' && top2 === 'Woody') archetype = 'Smoky Spiced Aristocrat';

  const description = `Your wardrobe leans ${top1.toLowerCase()} and ${top2.toLowerCase()}, anchored heavily by ${dominantNotes.slice(0, 3).map((n) => n.note).join(', ')}.`;

  return {
    totalBottles: total,
    dominantNotes,
    dominantAccords,
    archetype,
    description
  };
}

/**
 * Calculates a Blind-Buy Compatibility Score (0 - 100%)
 * for an incoming bottle against the user's saved collection.
 */
export function getCompatibilityScore(targetBottle, userBottles = []) {
  if (!targetBottle || !userBottles || userBottles.length === 0) return null;

  const targetNotes = new Set((targetBottle.notes || []).map((n) => n.toLowerCase()));
  if (targetNotes.size === 0) return 0;

  let totalScore = 0;

  userBottles.forEach((saved) => {
    const savedNotes = new Set((saved.notes || []).map((n) => n.toLowerCase()));
    let shared = 0;
    targetNotes.forEach((n) => {
      if (savedNotes.has(n)) shared++;
    });

    const unionSize = new Set([...targetNotes, ...savedNotes]).size;
    const similarity = unionSize === 0 ? 0 : shared / unionSize;
    totalScore += similarity;
  });

  // Normalized average score mapped to intuitive consumer percentage (35% - 98%)
  const rawAvg = totalScore / userBottles.length;
  const scaled = Math.min(99, Math.round(30 + rawAvg * 140));

  return Math.max(25, scaled);
}