// FeatureConnector type - matches the FeatureConnectorSchema in schemas.ts
export type FeatureConnector = "AND" | "OR";

// Base interface for items that can be ordered in columns
export interface OrderableItem {
  id: string;
  column?: number;
  position?: number;
  connector?: FeatureConnector;
}

export interface ProductFeature extends OrderableItem {
  id: string;
  name: string;
  description: string;
  points: string[];
  useCases: string[];
  price: number;
  cost: number;
  warranty?: string;
  sourceFeatureId?: string; // Optional lineage for duplicates
  imageUrl?: string; // URL to main product image
  thumbnailUrl?: string; // URL to thumbnail (optional, falls back to imageUrl)
  videoUrl?: string; // URL to product video (optional)
  // A La Carte publishing fields
  publishToAlaCarte?: boolean; // Whether this feature is published to A La Carte
  alaCartePrice?: number; // Price when sold as A La Carte (required if publishToAlaCarte is true)
  alaCarteWarranty?: string; // Optional warranty override for A La Carte
  alaCarteIsNew?: boolean; // Optional "new" flag for A La Carte
}

export interface PackageTier {
  id: string;
  name: string;
  price: number;
  cost: number;
  // This now contains the full feature objects, fetched from the DB
  features: ProductFeature[];
  isRecommended?: boolean;
  // Legacy field maintained for backward compatibility with existing data
  is_recommended?: boolean;
  tier_color: string;
}

export interface AlaCarteOption extends OrderableItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  description: string;
  points: string[];
  isNew?: boolean;
  warranty?: string;
  useCases?: string[];
  imageUrl?: string; // URL to main product image
  thumbnailUrl?: string; // URL to thumbnail (optional, falls back to imageUrl)
  videoUrl?: string; // URL to product video (optional)
  // Pick2 fields
  pick2Eligible?: boolean;
  pick2Sort?: number;
  shortValue?: string;
  highlights?: string[];
  // Publishing fields
  sourceFeatureId?: string; // Set to feature.id when published from a feature
  isPublished?: boolean; // true/false; customer A La Carte filters on this
}

export interface PriceOverrides {
  [id: string]: {
    price?: number;
    cost?: number;
  };
}

export interface Pick2Config {
  enabled: boolean;
  price: number;
  title?: string;
  subtitle?: string;
  maxSelections?: number;
  recommendedPairs?: Array<{
    label: string;
    optionIds: [string, string];
  }>;
  featuredPresetLabel?: string;
  presetOrder?: string[];
  telemetryEnabled?: boolean;
  telemetrySampleRate?: number;
}
