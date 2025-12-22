import type { PackageTier, ProductFeature, AlaCarteOption } from './types';
import { deriveTierFeatures } from './utils/featureOrdering';

// MOCK FEATURES (these would be in the 'features' table)
// These are the individual services that make up the packages.
// Column assignments for admin organization (ladder/inheritance model):
// - Column 1 = Gold Base (included in ALL packages)
// - Column 3 = Platinum Additions (included in Platinum and Elite)
// - Column 2 = Elite Additions (included in Elite only)
// - Column 4 = Admin organization only (does NOT control customer "Popular Add-ons" section)
//
// Package composition:
// - Gold:     Gets Column 1 (Gold Base)
// - Platinum: Gets Column 1 + Column 3 (Gold Base + Platinum Additions)
// - Elite:    Gets Column 1 + Column 3 + Column 2 (Gold Base + Platinum Additions + Elite Additions)
//
// Note: The customer-facing "Popular Add-ons" section is populated from alaCarteOptions
// filtered by MAIN_PAGE_ADDON_IDS (see App.tsx), not from Column 4 features.
//
// This mock data provides features for all three tiers:
// - Gold has 3 features (Column 1)
// - Elite has 3 features (Column 2)
// - Platinum has 3 features (Column 3)
// - Diamond Shield is assigned to Column 4 for admin organization
export const MOCK_FEATURES: ProductFeature[] = [
  // Gold Base features (Column 1) - included in ALL packages
  {
    id: 'rustguard-pro',
    name: 'RustGuard Pro',
    description: 'Underbody protection to prevent corrosion and structural damage.',
    points: [
      'Prolongs the life of vehicle',
      'Reduce repair/replacement costs',
      'Prevent structural weakness',
    ],
    useCases: [
      'Protects against road salt in winter.',
      'Prevents rust from forming on the chassis.',
    ],
    price: 0, // Price is included in package
    cost: 300,
    warranty: 'Lifetime coverage',
    column: 1, // Gold Base (included in all packages)
    position: 0, // First position in column
    connector: 'AND', // Default connector
  },
  {
    id: 'toughguard-premium',
    name: 'ToughGuard Premium',
    description: 'A premium paint sealant that protects against environmental damage.',
    points: [
      'One Time Application',
      'Eliminates waxing',
      'Covers damage from road tar, well water, bird droppings, tree sap, acid rain, etc.',
    ],
    useCases: [
      'Keeps your car looking glossy and new.',
      'Makes washing easier as dirt and grime slide off.',
    ],
    price: 0, // Price is included in package
    cost: 250,
    column: 1, // Gold Base (included in all packages)
    position: 1, // Second position in column
    connector: 'AND', // Default connector
  },
  {
    id: 'interior-protection',
    name: 'Interior Leather & Fabric Protection',
    description: 'A complete interior treatment to protect against stains and damage.',
    points: [
      'Protects against stains such as: coffee, juices, crayons, chocolate, gum',
      'Prevents cracking, covers rips, tears & burns',
    ],
    useCases: [
      'Ideal for families with children or pets.',
      'Maintains the value and appearance of your interior.',
    ],
    price: 0, // Price is included in package
    cost: 200,
    column: 1, // Gold Base (included in all packages)
    position: 2, // Third position in column
    connector: 'OR', // Special connector for Gold package display (shows as OR in Gold, AND in Platinum/Elite)
  },
  // Elite Additions (Column 2) - included in Elite only
  {
    id: 'elite-rustguard',
    name: 'RustGuard Pro',
    description: 'Underbody protection to prevent corrosion and structural damage.',
    points: [
      'Prolongs the life of vehicle',
      'Reduce repair/replacement costs',
      'Prevent structural weakness',
    ],
    useCases: [
      'Protects against road salt in winter.',
      'Prevents rust from forming on the chassis.',
    ],
    price: 0,
    cost: 300,
    warranty: 'Lifetime coverage',
    column: 2, // Elite Additions (Elite only)
    position: 0,
    connector: 'AND',
  },
  {
    id: 'elite-toughguard',
    name: 'ToughGuard Premium',
    description: 'A premium paint sealant that protects against environmental damage.',
    points: [
      'One Time Application',
      'Eliminates waxing',
      'Covers damage from road tar, well water, bird droppings, tree sap, acid rain, etc.',
    ],
    useCases: [
      'Keeps your car looking glossy and new.',
      'Makes washing easier as dirt and grime slide off.',
    ],
    price: 0,
    cost: 250,
    column: 2, // Elite Additions (Elite only)
    position: 1,
    connector: 'AND',
  },
  {
    id: 'elite-diamond-shield',
    name: 'Diamond Shield Windshield Protection',
    description: 'A treatment that improves visibility and protects your windshield.',
    points: [
      'Increase visibility in rain',
      'Protects against night glare',
      'Help against chipping, cracking, clouding, sand, salt',
    ],
    useCases: [
      'Safer driving in bad weather conditions.',
      'Prevents minor chips from turning into large cracks.',
    ],
    price: 0,
    cost: 150,
    column: 2, // Elite Additions (Elite only)
    position: 2,
    connector: 'AND',
  },
  // Platinum Additions (Column 3) - included in Platinum and Elite
  {
    id: 'platinum-rustguard',
    name: 'RustGuard Pro',
    description: 'Underbody protection to prevent corrosion and structural damage.',
    points: [
      'Prolongs the life of vehicle',
      'Reduce repair/replacement costs',
      'Prevent structural weakness',
    ],
    useCases: [
      'Protects against road salt in winter.',
      'Prevents rust from forming on the chassis.',
    ],
    price: 0,
    cost: 300,
    warranty: 'Lifetime coverage',
    column: 3, // Platinum Additions (Platinum and Elite)
    position: 0,
    connector: 'AND',
  },
  {
    id: 'platinum-toughguard',
    name: 'ToughGuard Premium',
    description: 'A premium paint sealant that protects against environmental damage.',
    points: [
      'One Time Application',
      'Eliminates waxing',
      'Covers damage from road tar, well water, bird droppings, tree sap, acid rain, etc.',
    ],
    useCases: [
      'Keeps your car looking glossy and new.',
      'Makes washing easier as dirt and grime slide off.',
    ],
    price: 0,
    cost: 250,
    column: 3, // Platinum Additions (Platinum and Elite)
    position: 1,
    connector: 'AND',
  },
  {
    id: 'platinum-interior',
    name: 'Interior Leather & Fabric Protection',
    description: 'A complete interior treatment to protect against stains and damage.',
    points: [
      'Protects against stains such as: coffee, juices, crayons, chocolate, gum',
      'Prevents cracking, covers rips, tears & burns',
    ],
    useCases: [
      'Ideal for families with children or pets.',
      'Maintains the value and appearance of your interior.',
    ],
    price: 0,
    cost: 200,
    column: 3, // Platinum Additions (Platinum and Elite)
    position: 2,
    connector: 'OR',
  },
  // Column 4 (admin organization)
  {
    id: 'diamond-shield',
    name: 'Diamond Shield Windshield Protection',
    description: 'A treatment that improves visibility and protects your windshield.',
    points: [
      'Increase visibility in rain',
      'Protects against night glare',
      'Help against chipping, cracking, clouding, sand, salt',
    ],
    useCases: [
      'Safer driving in bad weather conditions.',
      'Prevents minor chips from turning into large cracks.',
    ],
    price: 0, // Price is included in package
    cost: 150,
    // NOTE: This feature is placed in Column 4 for admin organization purposes only.
    // Column 4 does NOT control the customer-facing "Popular Add-ons" section.
    // Diamond Shield is a ProductFeature, not an AlaCarteOption, and is not in MAIN_PAGE_ADDON_IDS,
    // so it will NOT appear in the customer's "Popular Add-ons" section.
    column: 4, // Admin organization column (NOT displayed in customer Popular Add-ons)
    position: 0, // First position in column 4
    connector: 'AND', // Default connector
  },
];

// MOCK PACKAGES (these would be in the 'packages' table)
// Features are derived from column assignments using deriveTierFeatures
// Ladder/inheritance model ensures admin column configuration is the single source of truth:
// - Gold:     Column 1
// - Platinum: Columns 1 + 3
// - Elite:    Columns 1 + 3 + 2
export const MOCK_PACKAGES: PackageTier[] = [
  {
    id: 'package-elite',
    name: 'Elite',
    price: 3499,
    cost: 900,
    // Elite = Columns 1 + 3 + 2 (Gold Base + Platinum Additions + Elite Additions)
    features: deriveTierFeatures('Elite', MOCK_FEATURES),
    tier_color: 'gray-400',
  },
  {
    id: 'package-platinum',
    name: 'Platinum',
    price: 2899,
    cost: 750,
    // Platinum = Columns 1 + 3 (Gold Base + Platinum Additions)
    features: deriveTierFeatures('Platinum', MOCK_FEATURES),
    is_recommended: true,
    tier_color: 'blue-400',
  },
  {
    id: 'package-gold',
    name: 'Gold',
    price: 2399,
    cost: 550,
    // Gold = Column 1 (Gold Base)
    features: deriveTierFeatures('Gold', MOCK_FEATURES),
    tier_color: 'yellow-400',
  },
];

// MOCK A LA CARTE (these would be in the 'ala_carte_options' table)
// Column 4 = Popular Add-ons
export const MOCK_ALA_CARTE_OPTIONS: AlaCarteOption[] = (
[
  {
    id: 'suntek-complete',
    name: 'Suntek Pro Complete Package',
    price: 1195,
    cost: 550,
    description: 'Protects the most vulnerable parts of your vehicle from rock chips and scratches.',
    points: [
      'Prevents Rock Chips',
      'Protects 18"-24" Hood',
      'Front Bumper',
      'Fenders',
      'Mirrors',
      'Door Cups',
    ],
    warranty: '10 Year Warranty',
    column: 4, // Popular add-on
    position: 0,
    connector: 'AND',
  },
  {
    id: 'suntek-standard',
    name: 'Suntek Pro Standard Package',
    price: 795,
    cost: 350,
    description: 'Essential protection for the front-facing areas of your car.',
    points: ['Protects 18"-24" Hood', 'Fenders', 'Mirrors'],
    warranty: '10 Year Warranty',
    column: 4, // Popular add-on
    position: 1,
    connector: 'AND',
  },
  {
    id: 'headlights',
    name: 'Headlights Protection',
    price: 295,
    cost: 125,
    description: 'A durable film to prevent hazing, yellowing, and cracking of headlight lenses.',
    points: ['Maintains clarity for optimal night visibility.'],
    column: 4, // Popular add-on
    position: 2,
    connector: 'AND',
  },
  {
    id: 'doorcups',
    name: 'Door Cups Only',
    price: 195,
    cost: 75,
    description: 'Invisible film applied behind door handles to prevent scratches from keys and fingernails.',
    points: ['Protects a high-wear area from daily use.'],
    column: 4, // Popular add-on
    position: 3,
    connector: 'AND',
  },
  {
    id: 'evernew',
    name: 'EverNew Appearance Protection',
    price: 899,
    cost: 400,
    description: 'Mobile cosmetic repair service for minor damages.',
    points: [
      'Scratch, Chip, & Dent Repair',
      'Eliminate Insurance Claims',
      'Eliminate Bad Carfax',
      'Covered for 5 years',
      'We Come to You!',
    ],
    isNew: true,
    column: 4, // Popular add-on
    position: 4,
    connector: 'AND',
  },
  {
    id: 'screen-defender',
    name: 'Screen Defender',
    price: 149,
    cost: 50,
    description: 'Premium protection film for your vehicle\'s touchscreen display.',
    points: [
      'Anti-glare coating',
      'Scratch resistant',
      'Easy installation',
      'Crystal clear visibility',
    ],
    column: 4, // Popular add-on
    position: 5,
    connector: 'AND',
  },
  {
    id: 'diamond-shield',
    name: 'Diamond Shield Windshield Protection',
    price: 150,
    cost: 150,
    description: 'A treatment that improves visibility and protects your windshield.',
    points: [
      'Increase visibility in rain',
      'Protects against night glare',
      'Help against chipping, cracking, clouding, sand, salt',
    ],
    useCases: [
      'Safer driving in bad weather conditions.',
      'Prevents minor chips from turning into large cracks.',
    ],
    warranty: 'Lifetime coverage',
    column: 4,
    position: 6,
    connector: 'AND',
  },
  {
    id: 'rustguard-pro-alacarte',
    name: 'RustGuard Pro',
    price: 300,
    cost: 300,
    description: 'Underbody protection to prevent corrosion and structural damage.',
    points: [
      'Prolongs the life of vehicle',
      'Reduce repair/replacement costs',
      'Prevent structural weakness',
    ],
    useCases: [
      'Protects against road salt in winter.',
      'Prevents rust from forming on the chassis.',
    ],
    warranty: 'Lifetime coverage',
    column: 4,
    position: 7,
    connector: 'AND',
  },
  {
    id: 'toughguard-premium-alacarte',
    name: 'ToughGuard Premium',
    price: 250,
    cost: 250,
    description: 'A premium paint sealant that protects against environmental damage.',
    points: [
      'One Time Application',
      'Eliminates waxing',
      'Covers damage from road tar, well water, bird droppings, tree sap, acid rain, etc.',
    ],
    useCases: [
      'Keeps your car looking glossy and new.',
      'Makes washing easier as dirt and grime slide off.',
    ],
    column: 4,
    position: 8,
    connector: 'AND',
  },
  {
    id: 'interior-protection-alacarte',
    name: 'Interior Leather & Fabric Protection',
    price: 200,
    cost: 200,
    description: 'A complete interior treatment to protect against stains and damage.',
    points: [
      'Protects against stains such as: coffee, juices, crayons, chocolate, gum',
      'Prevents cracking, covers rips, tears & burns',
    ],
    useCases: [
      'Ideal for families with children or pets.',
      'Maintains the value and appearance of your interior.',
    ],
    column: 4,
    position: 9,
    connector: 'AND',
  },
  {
    id: 'elite-ceramic-coating',
    name: 'Elite Ceramic Coating',
    price: 500,
    cost: 500,
    description: 'Advanced ceramic protection with superior durability and shine.',
    points: [
      '9H hardness rating',
      'Hydrophobic water repellency',
      'UV protection for paint longevity',
    ],
    useCases: [
      'Provides showroom-quality shine for years.',
      'Reduces need for frequent washing and waxing.',
    ],
    warranty: '5 Year Warranty',
    column: 4,
    position: 10,
    connector: 'AND',
  },
  {
    id: 'elite-paint-correction',
    name: 'Elite Paint Correction',
    price: 400,
    cost: 400,
    description: 'Professional-grade paint restoration and polishing.',
    points: [
      'Removes swirl marks and scratches',
      'Restores original paint clarity',
      'Multi-stage polishing process',
    ],
    useCases: [
      'Eliminates imperfections from daily driving.',
      'Prepares surface for maximum coating adhesion.',
    ],
    column: 4,
    position: 11,
    connector: 'AND',
  },
  {
    id: 'elite-interior-detail',
    name: 'Elite Interior Detailing',
    price: 300,
    cost: 300,
    description: 'Comprehensive interior cleaning and protection treatment.',
    points: [
      'Deep cleaning of all surfaces',
      'Leather conditioning and protection',
      'Fabric stain guard application',
    ],
    useCases: [
      'Restores interior to like-new condition.',
      'Extends life of leather and fabric surfaces.',
    ],
    column: 4,
    position: 12,
    connector: 'AND',
  },
  {
    id: 'platinum-ppf-full',
    name: 'Platinum Full PPF Coverage',
    price: 800,
    cost: 800,
    description: 'Complete paint protection film coverage for maximum protection.',
    points: [
      'Full body PPF installation',
      'Self-healing technology',
      'Invisible protection barrier',
    ],
    useCases: [
      'Ultimate protection against rock chips and debris.',
      'Maintains resale value with pristine paint condition.',
    ],
    warranty: '10 Year Warranty',
    column: 4,
    position: 13,
    connector: 'AND',
  },
  {
    id: 'platinum-graphene-coating',
    name: 'Platinum Graphene Coating',
    price: 600,
    cost: 600,
    description: 'Next-generation graphene-infused ceramic coating.',
    points: [
      'Superior hardness and durability',
      'Anti-static dust repellency',
      'Enhanced heat dissipation',
    ],
    useCases: [
      'Top-tier protection for luxury vehicles.',
      'Lasts longer than traditional ceramic coatings.',
    ],
    warranty: '7 Year Warranty',
    column: 4,
    position: 14,
    connector: 'AND',
  },
  {
    id: 'platinum-wheel-coating',
    name: 'Platinum Wheel & Caliper Coating',
    price: 350,
    cost: 350,
    description: 'Protective coating for wheels and brake calipers.',
    points: [
      'Heat-resistant ceramic coating',
      'Repels brake dust and contaminants',
      'Easy cleaning and maintenance',
    ],
    useCases: [
      'Keeps wheels looking clean longer.',
      'Protects against corrosion and oxidation.',
    ],
    column: 4,
    position: 15,
    connector: 'AND',
  },
 ] as AlaCarteOption[]
).map(option => ({ ...option, isPublished: option.isPublished ?? true }));
