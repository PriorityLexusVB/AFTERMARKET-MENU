import type { PackageTier, ProductFeature, AlaCarteOption } from './types';

// MOCK FEATURES (these would be in the 'features' table)
// These are the individual services that make up the packages.
// Column assignments for admin organization: 1 = Gold & Platinum tiers, 2 = Elite tier (additional feature), 4 = Add-ons
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
    column: 2, // Elite tier feature (additional feature beyond Gold)
  },
];

// MOCK PACKAGES (these would be in the 'packages' table)
export const MOCK_PACKAGES: PackageTier[] = [
  {
    id: 'package-elite',
    name: 'Elite',
    price: 3499,
    cost: 900,
    // All four features included
    features: [MOCK_FEATURES[0]!, MOCK_FEATURES[1]!, MOCK_FEATURES[2]!, MOCK_FEATURES[3]!],
    tier_color: 'gray-400',
  },
  {
    id: 'package-platinum',
    name: 'Platinum',
    price: 2899,
    cost: 750,
    // First three features included
    features: [MOCK_FEATURES[0]!, MOCK_FEATURES[1]!, MOCK_FEATURES[2]!],
    is_recommended: true,
    tier_color: 'blue-400',
  },
  {
    id: 'package-gold',
    name: 'Gold',
    price: 2399,
    cost: 550,
    // RustGuard, and then either ToughGuard OR Interior Protection
    // The UI will show both with an "OR" divider.
    features: [MOCK_FEATURES[0]!, MOCK_FEATURES[1]!, MOCK_FEATURES[2]!],
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
  },
  {
    id: 'headlights',
    name: 'Headlights Protection',
    price: 295,
    cost: 125,
    description: 'A durable film to prevent hazing, yellowing, and cracking of headlight lenses.',
    points: ['Maintains clarity for optimal night visibility.'],
    column: 4, // Popular add-on
  },
  {
    id: 'doorcups',
    name: 'Door Cups Only',
    price: 195,
    cost: 75,
    description: 'Invisible film applied behind door handles to prevent scratches from keys and fingernails.',
    points: ['Protects a high-wear area from daily use.'],
    column: 4, // Popular add-on
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
  },
];