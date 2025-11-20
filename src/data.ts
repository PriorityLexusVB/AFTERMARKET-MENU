import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore/lite';
import { db } from './firebase';
import type { PackageTier, ProductFeature, AlaCarteOption } from './types';
import { MOCK_PACKAGES, MOCK_FEATURES, MOCK_ALA_CARTE_OPTIONS } from './mock';
import { validateDataArray, ProductFeatureSchema, AlaCarteOptionSchema } from './schemas';

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
 * @param featureData - The feature data to update (partial update supported).
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
 * Deletes a feature document from the 'features' collection in Firestore.
 * @param featureId - The ID of the feature to delete.
 * @returns A promise that resolves when the document is successfully deleted.
 */
export async function deleteFeature(featureId: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot delete feature.");
  }

  try {
    const featureRef = doc(db, 'features', featureId);
    await deleteDoc(featureRef);
  } catch (error) {
    console.error("Error deleting feature from Firestore:", error);
    throw new Error("Failed to delete the feature. Please check your connection and Firestore rules.");
  }
}

/**
 * Adds a new package document to the 'packages' collection in Firestore.
 * @param packageData - The package data to add, without an 'id'.
 * @returns A promise that resolves when the document is successfully added.
 */
export async function addPackage(packageData: {
  name: string;
  price: number;
  salePrice?: number;
  cost: number;
  featureIds: string[];
  is_recommended?: boolean;
  tier_color: string;
  showRetailValue?: boolean;
  displayOrder?: number;
}): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot add package.");
  }

  try {
    await addDoc(collection(db, 'packages'), packageData);
  } catch (error) {
    console.error("Error adding package to Firestore:", error);
    throw new Error("Failed to save the new package. Please check your connection and Firestore rules.");
  }
}

/**
 * Updates an existing package document in the 'packages' collection in Firestore.
 * @param packageId - The ID of the package to update.
 * @param packageData - The package data to update (partial update supported).
 * @returns A promise that resolves when the document is successfully updated.
 */
export async function updatePackage(packageId: string, packageData: Partial<{
  name: string;
  price: number;
  salePrice?: number;
  cost: number;
  featureIds: string[];
  is_recommended?: boolean;
  tier_color: string;
  showRetailValue?: boolean;
  displayOrder?: number;
}>): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot update package.");
  }

  try {
    const packageRef = doc(db, 'packages', packageId);
    await updateDoc(packageRef, packageData);
  } catch (error) {
    console.error("Error updating package in Firestore:", error);
    throw new Error("Failed to update the package. Please check your connection and Firestore rules.");
  }
}

/**
 * Deletes a package document from the 'packages' collection in Firestore.
 * @param packageId - The ID of the package to delete.
 * @returns A promise that resolves when the document is successfully deleted.
 */
export async function deletePackage(packageId: string): Promise<void> {
  if (!db) {
    throw new Error("Firebase is not initialized. Cannot delete package.");
  }

  try {
    const packageRef = doc(db, 'packages', packageId);
    await deleteDoc(packageRef);
  } catch (error) {
    console.error("Error deleting package from Firestore:", error);
    throw new Error("Failed to delete the package. Please check your connection and Firestore rules.");
  }
}