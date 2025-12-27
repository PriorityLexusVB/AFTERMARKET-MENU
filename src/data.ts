import { collection, getDocs, addDoc, updateDoc, doc, writeBatch, setDoc } from 'firebase/firestore/lite';
import { db } from './firebase';
import type { PackageTier, ProductFeature, AlaCarteOption } from './types';
import { MOCK_PACKAGES, MOCK_FEATURES, MOCK_ALA_CARTE_OPTIONS } from './mock';
import { validateDataArray, ProductFeatureSchema, AlaCarteOptionSchema } from './schemas';
import { deriveTierFeatures } from './utils/featureOrdering';

/**
 * Helper to read and normalize boolean environment variables.
 * @param varName - The full environment variable name (including the VITE_ prefix)
 * @param defaultValue - Default value if not set or invalid
 * @returns Boolean value
 */
function getBooleanEnvVar(varName: string, defaultValue: boolean): boolean {
  const value = import.meta.env[varName];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const normalized = String(value).toLowerCase().trim();
  return normalized === 'true' || normalized === '1';
}

/**
 * Normalizes legacy column/position fields to new columns/positionsByColumn format.
 * Ensures backward compatibility with existing Firestore documents.
 * 
 * Migration strategy:
 * - If columns exists, use it
 * - If only column exists, convert to columns array
 * - If positionsByColumn exists, use it
 * - If only position exists with column, create positionsByColumn entry
 * 
 * @param item - Item with potential legacy fields
 * @returns Normalized item with both legacy and new fields
 */
function normalizeColumnAssignment<T extends { column?: number; position?: number; columns?: number[]; positionsByColumn?: Record<number, number> }>(
  item: T
): T {
  const normalized = { ...item };
  
  // Normalize columns array
  if (!normalized.columns || normalized.columns.length === 0) {
    if (normalized.column !== undefined) {
      // Legacy single column: convert to array
      normalized.columns = [normalized.column];
    }
  }
  
  // Normalize positionsByColumn
  if (!normalized.positionsByColumn || Object.keys(normalized.positionsByColumn).length === 0) {
    if (normalized.position !== undefined && normalized.column !== undefined) {
      // Legacy single position: convert to per-column position
      normalized.positionsByColumn = { [normalized.column]: normalized.position };
    }
  }
  
  // For backward compatibility, keep column/position in sync with first entry in columns/positionsByColumn
  if (normalized.columns && normalized.columns.length > 0 && !normalized.column) {
    normalized.column = normalized.columns[0];
  }
  if (normalized.positionsByColumn && normalized.columns && normalized.columns.length > 0 && normalized.position === undefined) {
    const firstColumn = normalized.columns[0];
    if (firstColumn !== undefined && normalized.positionsByColumn[firstColumn] !== undefined) {
      normalized.position = normalized.positionsByColumn[firstColumn];
    }
  }
  
  return normalized;
}

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
    const validatedFeatures = validateDataArray(ProductFeatureSchema, rawFeatures, 'features');
    // Normalize to support both legacy and new column assignment fields
    const features: ProductFeature[] = validatedFeatures.map(normalizeColumnAssignment);

    // Fetch and validate a la carte options with Zod
    const rawAlaCarteOptions = alaCarteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const validatedAlaCarteOptions = validateDataArray(AlaCarteOptionSchema, rawAlaCarteOptions, 'ala_carte_options');
    // Normalize to support both legacy and new column assignment fields
    const alaCarteOptions: AlaCarteOption[] = validatedAlaCarteOptions.map(normalizeColumnAssignment);

    // Check if featureIds fallback is allowed (default: true for backward compatibility)
    const allowFeatureIdsFallback = getBooleanEnvVar('VITE_ALLOW_PACKAGE_FEATUREIDS_FALLBACK', true);

    const packages: PackageTier[] = packagesSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<FirebasePackage, 'id'>;
        // Derive features from column assignments based on tier name
        // This makes admin column configuration the single source of truth
        let derivedFeatures = deriveTierFeatures(data.name, features);
        
        // Handle fallback to featureIds if derived list is empty
        if (derivedFeatures.length === 0 && Array.isArray(data.featureIds) && data.featureIds.length > 0) {
          if (allowFeatureIdsFallback) {
            // Fallback is allowed: use featureIds but emit loud warning
            derivedFeatures = data.featureIds
              .map(id => features.find(f => f.id === id))
              .filter((f): f is ProductFeature => Boolean(f));
            
            console.warn(
              `⚠️ PACKAGE FALLBACK WARNING: Package "${data.name}" (doc ID: ${doc.id}) has empty column-derived features but is using featureIds fallback (${data.featureIds.length} feature IDs). ` +
              `This fallback will be deprecated. Please assign features to the correct column in Admin/Product Hub. ` +
              `To disable fallback and enforce strict mapping, set VITE_ALLOW_PACKAGE_FEATUREIDS_FALLBACK=false`
            );
          } else {
            // Fallback is disabled: keep empty and emit error
            console.error(
              `❌ PACKAGE CONFIGURATION ERROR: Package "${data.name}" (doc ID: ${doc.id}) has no features assigned to its column but featureIds fallback is disabled. ` +
              `The package will be empty on the customer-facing UI. ` +
              `To fix: Go to Admin > Package Features and assign features to the proper column (Elite=Column 1, Platinum=Column 2, Gold=Column 3). ` +
              `Or enable fallback temporarily with VITE_ALLOW_PACKAGE_FEATUREIDS_FALLBACK=true`
            );
          }
        }
        
        const pkg: PackageTier = {
            id: doc.id,
            name: data.name,
            price: data.price,
            cost: data.cost,
            is_recommended: data.is_recommended,
            tier_color: data.tier_color,
            features: derivedFeatures
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
          const updateData = {
            position: feature.position,
            ...(feature.column !== undefined && { column: feature.column }),
            ...(feature.connector !== undefined && { connector: feature.connector }),
          };
          
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
 * Adds a new A La Carte option document to the 'ala_carte_options' collection in Firestore.
 * @param optionData - The A La Carte option data to add, without an 'id'.
 * @returns A promise that resolves when the document is successfully added.
 */
export async function addAlaCarteOption(optionData: Omit<AlaCarteOption, 'id'>): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot add A La Carte option.");
  }
  
  try {
    await addDoc(collection(db, 'ala_carte_options'), optionData);
  } catch (error) {
    console.error("Error adding A La Carte option to Firestore:", error);
    throw new Error("Failed to save the new A La Carte option. Please check your connection and Firestore rules.");
  }
}

/**
 * Updates an existing A La Carte option document in the 'ala_carte_options' collection in Firestore.
 * @param optionId - The ID of the A La Carte option to update.
 * @param optionData - The A La Carte option data to update (partial).
 * @returns A promise that resolves when the document is successfully updated.
 */
export async function updateAlaCarteOption(optionId: string, optionData: Partial<Omit<AlaCarteOption, 'id'>>): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot update A La Carte option.");
  }
  
  try {
    const optionRef = doc(db, 'ala_carte_options', optionId);
    await updateDoc(optionRef, optionData);
  } catch (error) {
    console.error("Error updating A La Carte option in Firestore:", error);
    throw new Error("Failed to update the A La Carte option. Please check your connection and Firestore rules.");
  }
}

/**
 * Interface for A La Carte option position update
 */
export interface AlaCartePositionUpdate {
  id: string;
  position: number;
  column?: number;
  connector?: 'AND' | 'OR';
}

/**
 * Batch updates A La Carte option positions in Firestore with chunked writes and retry logic.
 * Handles Firestore's 500 operation limit per batch.
 * @param options - Array of A La Carte option position updates
 * @returns A promise that resolves when all updates are complete
 * @throws Error if any batch fails after all retries
 */
export async function batchUpdateAlaCartePositions(options: AlaCartePositionUpdate[]): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot batch update A La Carte options.");
  }

  if (options.length === 0) {
    return;
  }

  // Split options into chunks of FIRESTORE_BATCH_LIMIT
  const chunks: AlaCartePositionUpdate[][] = [];
  for (let i = 0; i < options.length; i += FIRESTORE_BATCH_LIMIT) {
    chunks.push(options.slice(i, i + FIRESTORE_BATCH_LIMIT));
  }

  // Process each chunk with retry logic
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    if (!chunk) continue;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const batch = writeBatch(db);
        
        for (const option of chunk) {
          const optionRef = doc(db, 'ala_carte_options', option.id);
          const updateData = {
            position: option.position,
            ...(option.column !== undefined && { column: option.column }),
            ...(option.connector !== undefined && { connector: option.connector }),
          };
          
          batch.update(optionRef, updateData);
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
      throw new Error(`Failed to update A La Carte option positions after ${MAX_RETRIES} attempts. Please check your connection and Firestore rules.`);
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
export { groupFeaturesByColumn, type GroupedFeatures } from './utils/featureOrdering';

/**
 * Publishes or updates a feature to the A La Carte options collection.
 * Uses stable doc ID based on feature.id to ensure idempotency.
 * @param feature - The feature to publish to A La Carte
 * @returns A promise that resolves when the A La Carte option is created/updated
 */
type AlaCarteUpsertOptions = Partial<Omit<AlaCarteOption, 'column' | 'position'>> & {
  column?: number | undefined;
  position?: number | undefined;
};

export async function upsertAlaCarteFromFeature(
  feature: ProductFeature,
  overrides: AlaCarteUpsertOptions = {}
): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot publish to A La Carte.");
  }

  const isPublishing = overrides.isPublished ?? true;
  const price = overrides.price ?? feature.alaCartePrice;

  if (isPublishing && (!feature.publishToAlaCarte || price === undefined)) {
    throw new Error("Feature must have publishToAlaCarte=true and alaCartePrice set to publish.");
  }

  try {
    // Use stable doc ID: the feature's ID
    const alaCarteRef = doc(db, 'ala_carte_options', feature.id);
    
    const warranty = overrides.warranty ?? feature.alaCarteWarranty ?? feature.warranty;

    // Build the A La Carte option data
    const alaCarteData: AlaCarteUpsertOptions = {
      name: feature.name,
      description: feature.description,
      points: feature.points,
      price: price ?? feature.price,
      cost: feature.cost,
      ...(warranty !== undefined ? { warranty } : {}),
      isNew: overrides.isNew ?? feature.alaCarteIsNew ?? false,
      useCases: feature.useCases,
      imageUrl: feature.imageUrl,
      thumbnailUrl: feature.thumbnailUrl,
      videoUrl: feature.videoUrl,
      sourceFeatureId: overrides.sourceFeatureId ?? feature.id,
      isPublished: overrides.isPublished ?? true,
      ...(Object.prototype.hasOwnProperty.call(overrides, 'column') ? { column: overrides.column } : {}),
      ...(Object.prototype.hasOwnProperty.call(overrides, 'position') ? { position: overrides.position } : {}),
      ...(Object.prototype.hasOwnProperty.call(overrides, 'connector') ? { connector: overrides.connector } : {}),
    };

    // Use setDoc with merge to create or update
    await setDoc(alaCarteRef, alaCarteData, { merge: true });
  } catch (error) {
    console.error("Error publishing feature to A La Carte:", error);
    throw new Error("Failed to publish feature to A La Carte. Please check your connection and Firestore rules.");
  }
}

/**
 * Unpublishes a feature from the A La Carte options collection.
 * Does NOT delete the doc; only sets isPublished to false.
 * @param featureId - The ID of the feature to unpublish
 * @returns A promise that resolves when the A La Carte option is updated
 */
export async function unpublishAlaCarteFromFeature(featureId: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot unpublish from A La Carte.");
  }

  try {
    const alaCarteRef = doc(db, 'ala_carte_options', featureId);
    await setDoc(alaCarteRef, { isPublished: false }, { merge: true });
  } catch (error) {
    console.error("Error unpublishing feature from A La Carte:", error);
    // If the doc doesn't exist, we can ignore the error (already unpublished)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'not-found') {
      console.warn(`A La Carte option ${featureId} not found, treating as already unpublished.`);
      return;
    }
    throw new Error("Failed to unpublish feature from A La Carte. Please check your connection and Firestore rules.");
  }
}
