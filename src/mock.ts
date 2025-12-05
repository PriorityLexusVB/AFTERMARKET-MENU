import type { PackageTier, ProductFeature, AlaCarteOption } from './types';
import { deriveTierFeatures } from './utils/featureOrdering';

// MOCK FEATURES (these would be in the 'features' table)
// These are the individual services that make up the packages.
// Column assignments for admin organization (direct 1:1 mapping):
// - Column 1 = Gold Tier features ONLY
// - Column 2 = Elite Tier features ONLY (empty = Elite package is empty)
// - Column 3 = Platinum Tier features ONLY (empty = Platinum package is empty)
// - Column 4 = Admin organization only (does NOT control customer "Popular Add-ons" section)
//
// Note: The customer-facing "Popular Add-ons" section is populated from alaCarteOptions
// filtered by MAIN_PAGE_ADDON_IDS (see App.tsx), not from Column 4 features.
//
// This mock data simulates the user's admin configuration where:
// - Gold has 3 features
// - Elite and Platinum columns are empty
// - Diamond Shield is assigned to Column 4 for admin organization
export const MOCK_FEATURES: ProductFeature[] = [
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
    column: 1, // Gold tier feature
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
    column: 1, // Gold tier feature
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
    column: 1, // Gold tier feature
    position: 2, // Third position in column
    connector: 'OR', // Special connector for Gold package display
  },
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
// Each tier gets ONLY features from its corresponding column (1:1 mapping)
// This ensures admin column configuration is the single source of truth
export const MOCK_PACKAGES: PackageTier[] = [
  {
    id: 'package-elite',
    name: 'Elite',
    price: 3499,
    cost: 900,
    // Elite = Column 2 features ONLY (empty in this mock = empty package)
    features: deriveTierFeatures('Elite', MOCK_FEATURES),
    tier_color: 'gray-400',
  },
  {
    id: 'package-platinum',
    name: 'Platinum',
    price: 2899,
    cost: 750,
    // Platinum = Column 3 features ONLY (empty in this mock = empty package)
    features: deriveTierFeatures('Platinum', MOCK_FEATURES),
    is_recommended: true,
    tier_color: 'blue-400',
  },
  {
    id: 'package-gold',
    name: 'Gold',
    price: 2399,
    cost: 550,
    // Gold = Column 1 features ONLY
    features: deriveTierFeatures('Gold', MOCK_FEATURES),
    tier_color: 'yellow-400',
  },
];

// MOCK A LA CARTE (these would be in the 'ala_carte_options' table)
// Column 4 = Popular Add-ons
export const MOCK_ALA_CARTE_OPTIONS: AlaCarteOption[] = [
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
];