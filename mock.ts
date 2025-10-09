import type { PackageTier, ProductFeature, AlaCarteOption } from './types';

// MOCK FEATURES (these would be in the 'features' table)
export const MOCK_FEATURES: ProductFeature[] = [
  {
    id: 'ppf-full',
    name: 'Full Front Paint Protection Film',
    description: 'Virtually invisible film applied to high-impact areas to protect from chips, scratches, and stains.',
    points: ['Full Hood, Fenders & Bumper', 'Mirrors & Door Edges', 'Self-Healing Technology', '10-Year Warranty'],
    useCases: ['Protects against rock chips on the highway.', 'Keeps the front end looking new.', 'Prevents damage from insects and bird droppings.'],
    price: 1895,
    cost: 900,
    warranty: '10-Year Limited Warranty'
  },
  {
    id: 'ceramic-coating',
    name: 'Graphene Ceramic Coating',
    description: 'A liquid polymer that bonds to the factory paint, creating a long-lasting layer of protection.',
    points: ['Extreme Gloss & Shine', 'Hydrophobic Properties', 'UV & Chemical Resistance', 'Easier Cleaning'],
    useCases: ['Water beads and rolls off the surface.', 'Protects paint from fading due to sun exposure.', 'Reduces the need for frequent waxing.'],
    price: 1295,
    cost: 600,
    warranty: '7-Year Limited Warranty'
  },
  {
    id: 'interior-protection',
    name: 'Total Interior Protection',
    description: 'Advanced sealant applied to all interior surfaces to protect against spills, stains, and UV damage.',
    points: ['Fabric, Leather & Vinyl', 'Repels Spills & Stains', 'Prevents Fading & Cracking', 'Reduces Odors'],
    useCases: ['Makes cleaning up coffee spills easy.', 'Protects leather seats from dye transfer from jeans.', 'Keeps the dashboard from cracking in the sun.'],
    price: 795,
    cost: 350,
    warranty: '5-Year Limited Warranty'
  },
   {
    id: 'window-tint',
    name: 'Ceramic Window Tint',
    description: 'High-performance ceramic tint that provides maximum heat rejection and UV protection.',
    points: ['99% UV Ray Rejection', 'Superior Heat Reduction', 'Reduces Glare', 'Will Not Interfere With Electronics'],
    useCases: ['Keeps the car cooler on hot days.', 'Protects interior from fading.', 'Increases privacy and security.'],
    price: 595,
    cost: 250,
    warranty: 'Lifetime Warranty'
  },
];

// MOCK PACKAGES (these would be in the 'packages' table)
export const MOCK_PACKAGES: PackageTier[] = [
  {
    id: 'package-platinum',
    name: 'Platinum',
    price: 3995,
    cost: 1900,
    features: [ MOCK_FEATURES[0], MOCK_FEATURES[1], MOCK_FEATURES[2], MOCK_FEATURES[3] ],
    is_recommended: true,
    tier_color: 'blue-400',
  },
  {
    id: 'package-gold',
    name: 'Gold',
    price: 2995,
    cost: 1400,
    features: [ MOCK_FEATURES[0], MOCK_FEATURES[1], MOCK_FEATURES[2] ],
    tier_color: 'yellow-400',
  },
  {
    id: 'package-silver',
    name: 'Silver',
    price: 1995,
    cost: 800,
    features: [ MOCK_FEATURES[1], MOCK_FEATURES[2] ],
    tier_color: 'gray-400',
  },
];

// MOCK A LA CARTE (these would be in the 'ala_carte_options' table)
export const MOCK_ALA_CARTE_OPTIONS: AlaCarteOption[] = [
  {
    id: 'suntek-complete',
    name: 'Suntek Complete PPF',
    price: 1895,
    cost: 900,
    description: 'Full front-end coverage including hood, fenders, bumper, and mirrors.',
    points: ['10-Year Warranty', 'Self-Healing Film'],
    isNew: true,
    warranty: '10-Year Limited Warranty'
  },
  {
    id: 'suntek-standard',
    name: 'Suntek Standard PPF',
    price: 995,
    cost: 450,
    description: 'Partial hood and fender coverage, plus mirrors and door cups.',
    points: ['Protects key impact zones', 'Cost-effective solution'],
    warranty: '10-Year Limited Warranty'
  },
  {
    id: 'evernew',
    name: 'EverNew Interior Repair',
    price: 499,
    cost: 200,
    description: 'On-demand repair of interior rips, tears, and burns.',
    points: ['Covers vinyl, leather, and fabric', 'Keeps interior pristine'],
    isNew: false,
  },
  {
    id: 'screen-defender',
    name: 'Screen Defender',
    price: 299,
    cost: 100,
    description: 'Anti-glare and anti-fingerprint protection for your infotainment screen.',
    points: ['Reduces glare', 'Easy to clean'],
  },
  {
    id: 'headlights',
    name: 'Headlight Protection',
    price: 199,
    cost: 75,
    description: 'Protects headlights from yellowing, cracking, and road debris.',
    points: [],
  },
  {
    id: 'doorcups',
    name: 'Door Cup Protection',
    price: 149,
    cost: 50,
    description: 'Prevents scratches behind the door handle from keys and fingernails.',
    points: [],
  }
];