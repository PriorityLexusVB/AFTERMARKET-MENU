import { collection, getDocs, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore/lite';
import { db } from './firebase';
import type { PackageTier, ProductFeature, AlaCarteOption } from './types';
import { MOCK_PACKAGES, MOCK_FEATURES, MOCK_ALA_CARTE_OPTIONS } from './mock';
import { validateDataArray, ProductFeatureSchema, AlaCarteOptionSchema } from './schemas';

// Maximum batch size for Firestore (limit is 500)
const FIRESTORE_BATCH_LIMIT = 500;

// Maximum retries for batch updates
const MAX_RETRIES = 3;

// Delay between retries in ms
const RETRY_DELAY_MS = 1000;

interface FetchDataResult {
    packages: PackageTier[];
    features: ProductFeature[];
    alaCarteOptions: AlaCarteOption[];
}

// A type for the raw package data from Firestore
interface FirebasePackage {
  id: string;
  name: string;
  price: number;
  cost: number;
  is_recommended?: boolean;
  tier_color: string;
  featureIds: string[]; // This array of strings (feature document IDs) is expected in your Firestore package documents
}

export async function fetchAllData(): Promise<FetchDataResult> {
  // If db is null (e.g., config error), we will fall back to mock data.
  if (!db) {
    console.warn("Firebase not initialized, falling back to mock data.");
    return {
      packages: MOCK_PACKAGES,
      features: MOCK_FEATURES,
      alaCarteOptions: MOCK_ALA_CARTE_OPTIONS,
    };
  }
  
  try {
    const [featuresSnapshot, alaCarteSnapshot, packagesSnapshot] = await Promise.all([
      getDocs(collection(db, 'features')),
      getDocs(collection(db, 'ala_carte_options')),
      getDocs(collection(db, 'packages')),
    ]);

    // Fetch and validate features with Zod
    const rawFeatures = featuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const features: ProductFeature[] = validateDataArray(ProductFeatureSchema, rawFeatures, 'features');

    // Fetch and validate a la carte options with Zod
    const rawAlaCarteOptions = alaCarteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const alaCarteOptions: AlaCarteOption[] = validateDataArray(AlaCarteOptionSchema, rawAlaCarteOptions, 'ala_carte_options');
    
    const featuresMap = new Map(features.map(f => [f.id, f]));

    const packages: PackageTier[] = packagesSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<FirebasePackage, 'id'>;
        const pkg: PackageTier = {
            id: doc.id,
            name: data.name,
            price: data.price,
            cost: data.cost,
            is_recommended: data.is_recommended,
            tier_color: data.tier_color,
            features: (data.featureIds || []).map(id => featuresMap.get(id)).filter((f): f is ProductFeature => !!f)
        };
        return pkg;
    });
    
    // If no data is fetched (e.g., empty collections), fallback to mock data to ensure the app is usable.
    if (packages.length === 0 && features.length === 0 && alaCarteOptions.length === 0) {
      console.warn("No data found in Firestore, falling back to mock data.");
      return {
          packages: MOCK_PACKAGES,
          features: MOCK_FEATURES,
          alaCarteOptions: MOCK_ALA_CARTE_OPTIONS,
      };
    }

    return { packages, features, alaCarteOptions };
  } catch (error) {
      console.error("Error fetching data from Firestore, falling back to mock data.", error);
      // In case of error (e.g., permissions), fall back to mocks so the app is still usable.
      return {
        packages: MOCK_PACKAGES,
        features: MOCK_FEATURES,
        alaCarteOptions: MOCK_ALA_CARTE_OPTIONS,
      };
  }
}

/**
 * Adds a new feature document to the 'features' collection in Firestore.
 * @param featureData - The feature data to add, without an 'id'.
 * @returns A promise that resolves when the document is successfully added.
 */
export async function addFeature(featureData: Omit<ProductFeature, 'id'>): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot add feature.");
  }
  
  try {
    await addDoc(collection(db, 'features'), featureData);
  } catch (error) {
    console.error("Error adding feature to Firestore:", error);
    // Re-throw the error to be handled by the calling function
    throw new Error("Failed to save the new feature. Please check your connection and Firestore rules.");
  }
}

/**
 * Updates an existing feature document in the 'features' collection in Firestore.
 * @param featureId - The ID of the feature to update.
 * @param featureData - The feature data to update (partial).
 * @returns A promise that resolves when the document is successfully updated.
 */
export async function updateFeature(featureId: string, featureData: Partial<Omit<ProductFeature, 'id'>>): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot update feature.");
  }
  
  try {
    const featureRef = doc(db, 'features', featureId);
    await updateDoc(featureRef, featureData);
  } catch (error) {
    console.error("Error updating feature in Firestore:", error);
    throw new Error("Failed to update the feature. Please check your connection and Firestore rules.");
  }
}

/**
 * Interface for feature position update
 */
export interface FeaturePositionUpdate {
  id: string;
  position: number;
  column?: number;
  connector?: 'AND' | 'OR';
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch updates feature positions in Firestore with chunked writes and retry logic.
 * Handles Firestore's 500 operation limit per batch.
 * @param features - Array of feature position updates
 * @returns A promise that resolves when all updates are complete
 * @throws Error if any batch fails after all retries
 */
export async function batchUpdateFeaturesPositions(features: FeaturePositionUpdate[]): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot batch update features.");
  }

  if (features.length === 0) {
    return;
  }

  // Split features into chunks of FIRESTORE_BATCH_LIMIT
  const chunks: FeaturePositionUpdate[][] = [];
  for (let i = 0; i < features.length; i += FIRESTORE_BATCH_LIMIT) {
    chunks.push(features.slice(i, i + FIRESTORE_BATCH_LIMIT));
  }

  // Process each chunk with retry logic
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    if (!chunk) continue;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const batch = writeBatch(db);
        
        for (const feature of chunk) {
          const featureRef = doc(db, 'features', feature.id);
          const updateData: Record<string, number | string | undefined> = {
            position: feature.position,
          };
          
          if (feature.column !== undefined) {
            updateData['column'] = feature.column;
          }
          
          if (feature.connector !== undefined) {
            updateData['connector'] = feature.connector;
          }
          
          batch.update(featureRef, updateData);
        }
        
        await batch.commit();
        lastError = null;
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Batch update attempt ${attempt + 1} failed for chunk ${chunkIndex + 1}:`, error);
        
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    if (lastError) {
      throw new Error(`Failed to update feature positions after ${MAX_RETRIES} attempts. Please check your connection and Firestore rules.`);
    }
  }
}

/**
 * Sorts features by column and position for display.
 * Features without position are sorted to the end within their column.
 * @param features - Array of features to sort
 * @returns Sorted array of features
 * @deprecated Use sortFeatures from './utils/featureOrdering' instead
 */
export { sortFeatures as sortFeaturesByPosition } from './utils/featureOrdering';

/**
 * Groups features by column number and sorts them by position within each column.
 * @param features - Array of features to group
 * @returns Object with columns 1-4 and unassigned features, each sorted by position
 * @deprecated Use groupFeaturesByColumn from './utils/featureOrdering' instead
 */
export { groupFeaturesByColumn, type GroupedFeaturesByColumn as GroupedFeatures } from './utils/featureOrdering';