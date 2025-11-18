import { z } from 'zod';

/**
 * Zod schemas for runtime data validation.
 * These schemas ensure that data fetched from Firestore matches our expected types.
 */

// Product Feature Schema
export const ProductFeatureSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  points: z.array(z.string()),
  useCases: z.array(z.string()),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  warranty: z.string().optional(),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  thumbnailUrl: z.string().url('Thumbnail URL must be valid').optional().or(z.literal('')),
  videoUrl: z.string().url('Video URL must be valid').optional().or(z.literal('')),
});

export type ProductFeature = z.infer<typeof ProductFeatureSchema>;

// A La Carte Option Schema
export const AlaCarteOptionSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  description: z.string().min(1, 'Description is required'),
  points: z.array(z.string()),
  isNew: z.boolean().optional(),
  warranty: z.string().optional(),
  useCases: z.array(z.string()).optional(),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  thumbnailUrl: z.string().url('Thumbnail URL must be valid').optional().or(z.literal('')),
  videoUrl: z.string().url('Video URL must be valid').optional().or(z.literal('')),
});

export type AlaCarteOption = z.infer<typeof AlaCarteOptionSchema>;

// Package Tier Schema
export const PackageTierSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  features: z.array(ProductFeatureSchema),
  is_recommended: z.boolean().optional(),
  tier_color: z.string().min(1, 'Tier color is required'),
});

export type PackageTier = z.infer<typeof PackageTierSchema>;

// Price Overrides Schema
export const PriceOverrideSchema = z.object({
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
});

export const PriceOverridesSchema = z.record(z.string(), PriceOverrideSchema);

export type PriceOverrides = z.infer<typeof PriceOverridesSchema>;

// Customer Info Schema
export const CustomerInfoSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  year: z.string().min(4, 'Year must be valid'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
});

export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;

// Environment Variables Schema (for validation during startup)
export const EnvSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1).optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_GEMINI_API_KEY: z.string().min(1).optional(),
  VITE_USE_AI_PROXY: z.enum(['true', 'false']).optional(),
});

/**
 * Helper function to safely parse and validate data
 * Returns null if validation fails and logs the error
 */
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `Validation error${context ? ` in ${context}` : ''}:`,
      result.error.format()
    );
    return null;
  }

  return result.data;
}

/**
 * Helper function to validate array of data items
 * Filters out invalid items and logs errors
 */
export function validateDataArray<T>(
  schema: z.ZodSchema<T>,
  dataArray: unknown[],
  context?: string
): T[] {
  const validItems: T[] = [];

  dataArray.forEach((item, index) => {
    const result = schema.safeParse(item);

    if (result.success) {
      validItems.push(result.data);
    } else {
      console.error(
        `Validation error${context ? ` in ${context}` : ''} for item ${index}:`,
        result.error.format()
      );
    }
  });

  return validItems;
}
