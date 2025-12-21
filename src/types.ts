// FeatureConnector type - matches the FeatureConnectorSchema in schemas.ts
export type FeatureConnector = 'AND' | 'OR';

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
  imageUrl?: string;      // URL to main product image
  thumbnailUrl?: string;  // URL to thumbnail (optional, falls back to imageUrl)
  videoUrl?: string;      // URL to product video (optional)
  publishToAlaCarte?: boolean; // Whether this feature should be published to A La Carte
  alaCartePrice?: number;      // Price when sold as A La Carte (required if publishToAlaCarte is true)
  alaCarteWarranty?: string;   // Optional warranty override for A La Carte
  alaCarteIsNew?: boolean;     // Optional "new" badge for A La Carte
}

export interface PackageTier {
  id:string;
  name: string;
  price: number;
  cost: number;
  // This now contains the full feature objects, fetched from the DB
  features: ProductFeature[];
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
  imageUrl?: string;      // URL to main product image
  thumbnailUrl?: string;  // URL to thumbnail (optional, falls back to imageUrl)
  videoUrl?: string;      // URL to product video (optional)
  sourceFeatureId?: string; // ID of the feature this was published from (if applicable)
  isPublished?: boolean;    // Whether this option is currently published for customers
}

export interface PriceOverrides {
  [id: string]: {
    price?: number;
    cost?: number;
  };
}