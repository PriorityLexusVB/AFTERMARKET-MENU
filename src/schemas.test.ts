import { describe, it, expect } from 'vitest';
import {
  ProductFeatureSchema,
  AlaCarteOptionSchema,
  PackageTierSchema,
  PriceOverridesSchema,
  FeatureConnectorSchema,
  validateDataArray,
  safeParseData,
} from './schemas';

describe('FeatureConnectorSchema', () => {
  it('should accept "AND" as a valid connector', () => {
    const result = FeatureConnectorSchema.safeParse('AND');
    expect(result.success).toBe(true);
  });

  it('should accept "OR" as a valid connector', () => {
    const result = FeatureConnectorSchema.safeParse('OR');
    expect(result.success).toBe(true);
  });

  it('should reject invalid connector values', () => {
    const result = FeatureConnectorSchema.safeParse('INVALID');
    expect(result.success).toBe(false);
  });
});

describe('ProductFeatureSchema', () => {
  it('should validate a valid product feature', () => {
    const validFeature = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: ['Point 1', 'Point 2'],
      useCases: ['Use case 1'],
      price: 1000,
      cost: 500,
      warranty: '5 years',
    };

    const result = ProductFeatureSchema.safeParse(validFeature);
    expect(result.success).toBe(true);
  });

  it('should validate a feature with position and connector', () => {
    const featureWithPositionConnector = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      position: 0,
      connector: 'AND',
    };

    const result = ProductFeatureSchema.safeParse(featureWithPositionConnector);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe(0);
      expect(result.data.connector).toBe('AND');
    }
  });

  it('should validate a feature with OR connector', () => {
    const featureWithOrConnector = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      connector: 'OR',
    };

    const result = ProductFeatureSchema.safeParse(featureWithOrConnector);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.connector).toBe('OR');
    }
  });

  it('should fail with negative position', () => {
    const featureWithNegativePosition = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      position: -1,
    };

    const result = ProductFeatureSchema.safeParse(featureWithNegativePosition);
    expect(result.success).toBe(false);
  });

  it('should fail with invalid connector', () => {
    const featureWithInvalidConnector = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      connector: 'INVALID',
    };

    const result = ProductFeatureSchema.safeParse(featureWithInvalidConnector);
    expect(result.success).toBe(false);
  });

  it('should fail validation with negative price', () => {
    const invalidFeature = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: -100,
      cost: 500,
    };

    const result = ProductFeatureSchema.safeParse(invalidFeature);
    expect(result.success).toBe(false);
  });

  it('should accept optional image URLs', () => {
    const featureWithImage = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      imageUrl: 'https://example.com/image.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    };

    const result = ProductFeatureSchema.safeParse(featureWithImage);
    expect(result.success).toBe(true);
  });

  it('should fail with invalid image URL', () => {
    const featureWithInvalidUrl = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      imageUrl: 'not-a-url',
    };

    const result = ProductFeatureSchema.safeParse(featureWithInvalidUrl);
    expect(result.success).toBe(false);
  });

  it('should validate feature with A La Carte publishing fields', () => {
    const featureWithAlaCarte = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      publishToAlaCarte: true,
      alaCartePrice: 1500,
      alaCarteWarranty: 'Extended warranty',
      alaCarteIsNew: true,
    };

    const result = ProductFeatureSchema.safeParse(featureWithAlaCarte);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publishToAlaCarte).toBe(true);
      expect(result.data.alaCartePrice).toBe(1500);
      expect(result.data.alaCarteWarranty).toBe('Extended warranty');
      expect(result.data.alaCarteIsNew).toBe(true);
    }
  });

  it('should fail when publishToAlaCarte is true but alaCartePrice is missing', () => {
    const featureWithoutPrice = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      publishToAlaCarte: true,
    };

    const result = ProductFeatureSchema.safeParse(featureWithoutPrice);
    expect(result.success).toBe(false);
  });

  it('should succeed when publishToAlaCarte is false without alaCartePrice', () => {
    const featureNotPublished = {
      id: 'test-1',
      name: 'Test Feature',
      description: 'Test description',
      points: [],
      useCases: [],
      price: 1000,
      cost: 500,
      publishToAlaCarte: false,
    };

    const result = ProductFeatureSchema.safeParse(featureNotPublished);
    expect(result.success).toBe(true);
  });
});

describe('AlaCarteOptionSchema', () => {
  it('should validate a valid a la carte option', () => {
    const validOption = {
      id: 'option-1',
      name: 'Test Option',
      price: 500,
      cost: 250,
      description: 'Test description',
      points: ['Point 1'],
    };

    const result = AlaCarteOptionSchema.safeParse(validOption);
    expect(result.success).toBe(true);
  });

  it('should default isPublished to false when missing', () => {
    const validOption = {
      id: 'option-1',
      name: 'Test Option',
      price: 500,
      cost: 250,
      description: 'Test description',
      points: ['Point 1'],
    };

    const result = AlaCarteOptionSchema.safeParse(validOption);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  it('should accept isNew flag', () => {
    const newOption = {
      id: 'option-1',
      name: 'New Option',
      price: 500,
      cost: 250,
      description: 'Test description',
      points: [],
      isNew: true,
    };

    const result = AlaCarteOptionSchema.safeParse(newOption);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isNew).toBe(true);
    }
  });

  it('should validate option with sourceFeatureId and isPublished', () => {
    const publishedOption = {
      id: 'option-1',
      name: 'Published Option',
      price: 500,
      cost: 250,
      description: 'Test description',
      points: [],
      sourceFeatureId: 'feature-123',
      isPublished: true,
    };

    const result = AlaCarteOptionSchema.safeParse(publishedOption);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceFeatureId).toBe('feature-123');
      expect(result.data.isPublished).toBe(true);
    }
  });

  it('should validate unpublished option', () => {
    const unpublishedOption = {
      id: 'option-1',
      name: 'Unpublished Option',
      price: 500,
      cost: 250,
      description: 'Test description',
      points: [],
      isPublished: false,
    };

    const result = AlaCarteOptionSchema.safeParse(unpublishedOption);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });
});

describe('PackageTierSchema', () => {
  it('should validate a complete package', () => {
    const validPackage = {
      id: 'pkg-1',
      name: 'Elite Package',
      price: 3000,
      cost: 1500,
      features: [
        {
          id: 'feat-1',
          name: 'Feature 1',
          description: 'Desc',
          points: [],
          useCases: [],
          price: 1000,
          cost: 500,
        },
      ],
      tier_color: 'blue-400',
      is_recommended: true,
    };

    const result = PackageTierSchema.safeParse(validPackage);
    expect(result.success).toBe(true);
  });
});

describe('PriceOverridesSchema', () => {
  it('should validate price overrides', () => {
    const overrides = {
      'item-1': { price: 1200 },
      'item-2': { cost: 600 },
      'item-3': { price: 1500, cost: 750 },
    };

    const result = PriceOverridesSchema.safeParse(overrides);
    expect(result.success).toBe(true);
  });

  it('should fail with negative overrides', () => {
    const invalidOverrides = {
      'item-1': { price: -100 },
    };

    const result = PriceOverridesSchema.safeParse(invalidOverrides);
    expect(result.success).toBe(false);
  });
});

describe('safeParseData', () => {
  it('should return data on successful parse', () => {
    const validData = {
      id: 'test',
      name: 'Test',
      description: 'Desc',
      points: [],
      useCases: [],
      price: 100,
      cost: 50,
    };

    const result = safeParseData(ProductFeatureSchema, validData);
    expect(result).toMatchObject({ ...validData, publishToAlaCarte: false });
  });

  it('should return null on failed parse', () => {
    const invalidData = {
      id: 'test',
      name: 'Test',
      // missing required fields
    };

    const result = safeParseData(ProductFeatureSchema, invalidData);
    expect(result).toBeNull();
  });
});

describe('validateDataArray', () => {
  it('should filter out invalid items', () => {
    const mixedData = [
      {
        id: 'valid-1',
        name: 'Valid',
        description: 'Desc',
        points: [],
        useCases: [],
        price: 100,
        cost: 50,
      },
      {
        id: 'invalid',
        // missing required fields
      },
      {
        id: 'valid-2',
        name: 'Valid 2',
        description: 'Desc 2',
        points: [],
        useCases: [],
        price: 200,
        cost: 100,
      },
    ];

    const result = validateDataArray(ProductFeatureSchema, mixedData);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('valid-1');
    expect(result[1]?.id).toBe('valid-2');
  });

  it('should return empty array for all invalid items', () => {
    const invalidData = [
      { id: 'bad-1' },
      { id: 'bad-2' },
    ];

    const result = validateDataArray(ProductFeatureSchema, invalidData);
    expect(result).toHaveLength(0);
  });
});
