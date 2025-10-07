import { supabase } from './supabaseClient';
import type { PackageTier, ProductFeature, AlaCarteOption } from './types';

// Helper to convert DB snake_case to JS camelCase
// Supabase returns fields with quotes (e.g., "useCases") as is, so we only need to convert a few.
const packageTierFromDb = (dbPackage: any): PackageTier => ({
  ...dbPackage,
  is_recommended: dbPackage.is_recommended,
  tier_color: dbPackage.tier_color,
});

const featureFromDb = (dbFeature: any): ProductFeature => ({
    ...dbFeature,
    useCases: dbFeature.useCases || [],
});

const alaCarteOptionFromDb = (dbOption: any): AlaCarteOption => ({
    ...dbOption,
    isNew: dbOption.isNew,
    useCases: dbOption.useCases || [],
});


export async function fetchAllData() {
  const [packagesRes, featuresRes, alaCarteOptionsRes] = await Promise.all([
    supabase
      .from('packages')
      .select(`
        id,
        name,
        price,
        is_recommended,
        tier_color,
        features (
          id,
          name,
          description,
          points,
          "useCases",
          price
        )
      `),
    supabase.from('features').select('*'),
    supabase.from('ala_carte_options').select('*')
  ]);

  if (packagesRes.error) throw new Error(`Failed to fetch packages: ${packagesRes.error.message}`);
  if (featuresRes.error) throw new Error(`Failed to fetch features: ${featuresRes.error.message}`);
  if (alaCarteOptionsRes.error) throw new Error(`Failed to fetch a la carte options: ${alaCarteOptionsRes.error.message}`);

  const packages: PackageTier[] = packagesRes.data.map(packageTierFromDb);
  const features: ProductFeature[] = featuresRes.data.map(featureFromDb);
  const alaCarteOptions: AlaCarteOption[] = alaCarteOptionsRes.data.map(alaCarteOptionFromDb);

  return { packages, features, alaCarteOptions };
}
