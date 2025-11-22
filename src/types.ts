export interface ProductFeature {
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
  column?: number;        // Column assignment (1-4) for admin organization
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

export interface AlaCarteOption {
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
  column?: number;        // Column assignment (1-4) for admin organization
}

export interface PriceOverrides {
  [id: string]: {
    price?: number;
    cost?: number;
  };
}