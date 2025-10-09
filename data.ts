import type { PackageTier, ProductFeature, AlaCarteOption } from './types';
import { MOCK_PACKAGES, MOCK_FEATURES, MOCK_ALA_CARTE_OPTIONS } from './mock';

interface FetchDataResult {
    packages: PackageTier[];
    features: ProductFeature[];
    alaCarteOptions: AlaCarteOption[];
}

// Data fetching is now synchronous and uses local mock data.
export function fetchAllData(): FetchDataResult {
  return {
      packages: MOCK_PACKAGES,
      features: MOCK_FEATURES,
      alaCarteOptions: MOCK_ALA_CARTE_OPTIONS,
  };
}
