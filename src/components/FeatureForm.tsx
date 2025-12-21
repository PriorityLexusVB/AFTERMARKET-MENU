import React, { useState, useEffect } from 'react';
import { addFeature, updateFeature, upsertAlaCarteFromFeature, unpublishAlaCarteFromFeature } from '../data';
import { ImageUploader } from './ImageUploader';
import type { ProductFeature, FeatureConnector } from '../types';

interface FeatureFormProps {
  onSaveSuccess: () => void;
  editingFeature?: ProductFeature | null;
  onCancelEdit?: () => void;
}

const initialFormState = {
  name: '',
  price: '',
  cost: '',
  description: '',
  warranty: '',
  points: '',
  useCases: '',
  imageUrl: '',
  thumbnailUrl: '',
  videoUrl: '',
  column: '',
  connector: 'AND' as FeatureConnector,
  publishToAlaCarte: false,
  alaCartePrice: '',
  alaCarteWarranty: '',
  alaCarteIsNew: false,
};

export const FeatureForm: React.FC<FeatureFormProps> = ({ onSaveSuccess, editingFeature, onCancelEdit }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingFeature;
  const isFormValid = formData.name && formData.price && formData.cost && formData.description && 
    (!formData.publishToAlaCarte || (formData.publishToAlaCarte && formData.alaCartePrice));

  // Populate form when editing
  useEffect(() => {
    if (editingFeature) {
      setFormData({
        name: editingFeature.name,
        price: editingFeature.price.toString(),
        cost: editingFeature.cost.toString(),
        description: editingFeature.description,
        warranty: editingFeature.warranty || '',
        points: editingFeature.points.join('\n'),
        useCases: editingFeature.useCases.join('\n'),
        imageUrl: editingFeature.imageUrl || '',
        thumbnailUrl: editingFeature.thumbnailUrl || '',
        videoUrl: editingFeature.videoUrl || '',
        column: editingFeature.column?.toString() || '',
        connector: editingFeature.connector || 'AND',
        publishToAlaCarte: editingFeature.publishToAlaCarte || false,
        alaCartePrice: editingFeature.alaCartePrice?.toString() || '',
        alaCarteWarranty: editingFeature.alaCarteWarranty || '',
        alaCarteIsNew: editingFeature.alaCarteIsNew || false,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingFeature]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        setError("Please fill out all required fields.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        // Build the feature data object with proper typing
        const featureData: Omit<ProductFeature, 'id'> = {
            name: formData.name,
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost),
            description: formData.description,
            warranty: formData.warranty || '',
            points: formData.points.split('\n').filter(line => line.trim() !== ''),
            useCases: formData.useCases.split('\n').filter(line => line.trim() !== ''),
            connector: formData.connector,
            ...(formData.imageUrl && { imageUrl: formData.imageUrl.trim() }),
            ...(formData.thumbnailUrl && { thumbnailUrl: formData.thumbnailUrl.trim() }),
            ...(formData.videoUrl && { videoUrl: formData.videoUrl.trim() }),
            publishToAlaCarte: formData.publishToAlaCarte,
        };

        // Add A La Carte fields if publishing
        if (formData.publishToAlaCarte) {
            if (!formData.alaCartePrice) {
                throw new Error("A La Carte price is required when publishing to A La Carte.");
            }
            featureData.alaCartePrice = parseFloat(formData.alaCartePrice);
            if (formData.alaCarteWarranty) {
                featureData.alaCarteWarranty = formData.alaCarteWarranty;
            }
            featureData.alaCarteIsNew = formData.alaCarteIsNew;
        }

        // Add column if valid
        if (formData.column) {
            const parsedColumn = parseInt(formData.column);
            if (!isNaN(parsedColumn)) {
                featureData.column = parsedColumn;
            }
        }

        if (isNaN(featureData.price) || isNaN(featureData.cost)) {
            throw new Error("Price and Cost must be valid numbers.");
        }

        if (formData.publishToAlaCarte && featureData.alaCartePrice !== undefined && isNaN(featureData.alaCartePrice)) {
            throw new Error("A La Carte price must be a valid number.");
        }

        let savedFeatureId: string;
        
        if (isEditMode && editingFeature) {
            await updateFeature(editingFeature.id, featureData);
            savedFeatureId = editingFeature.id;
        } else {
            // For new features, save the feature first
            await addFeature(featureData);
            
            // Show a warning if user wanted to publish but can't on initial create
            if (formData.publishToAlaCarte) {
                setError("Feature saved successfully. To publish to A La Carte, please edit this feature after the page refreshes.");
            }
            
            setFormData(initialFormState); // Only reset for add mode
            onSaveSuccess();
            setIsLoading(false);
            return;
        }

        // Handle publishing/unpublishing for existing features
        if (formData.publishToAlaCarte && savedFeatureId) {
            // Construct full feature object by merging existing feature with updates
            const fullFeature: ProductFeature = {
                ...editingFeature,
                ...featureData,
                id: savedFeatureId,
            };
            await upsertAlaCarteFromFeature(fullFeature);
        } else if (!formData.publishToAlaCarte && savedFeatureId) {
            await unpublishAlaCarteFromFeature(savedFeatureId);
        }

        onSaveSuccess();

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
  const FormRow: React.FC<{ children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 items-start ${className}`}>
        {children}
    </div>
  );
  
  const Label: React.FC<{ htmlFor: string, text: string, required?: boolean, helpText?: string }> = ({ htmlFor, text, required, helpText }) => (
    <label htmlFor={htmlFor} className="font-semibold text-gray-300 md:text-right pt-2">
        {text} {required && <span className="text-red-400">*</span>}
        {helpText && <p className="text-xs font-normal text-gray-500 mt-1">{helpText}</p>}
    </label>
  );

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-fade-in">
        <form onSubmit={handleSave} className="space-y-4">
            <FormRow>
                <Label htmlFor="name" text="Feature Name" required />
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    required
                />
            </FormRow>
            <FormRow>
                <Label htmlFor="price" text="Retail Price ($)" required />
                <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    required
                />
            </FormRow>
             <FormRow>
                <Label htmlFor="cost" text="Internal Cost ($)" required />
                <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    required
                />
            </FormRow>
            <FormRow>
                <Label htmlFor="description" text="Description" required />
                <textarea
                    id="description"
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    required
                />
            </FormRow>
             <FormRow>
                <Label htmlFor="warranty" text="Warranty" helpText="(Optional)" />
                <input
                    type="text"
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                />
            </FormRow>
            <FormRow>
                <Label htmlFor="column" text="Display Column" helpText="Package tier organization" />
                <select
                    id="column"
                    name="column"
                    value={formData.column}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                >
                    <option value="">No Column Assignment</option>
                    <option value="1">Column 1 - Gold Tier</option>
                    <option value="2">Column 2 - Elite Tier</option>
                    <option value="3">Column 3 - Platinum Tier</option>
                    <option value="4">Column 4 - Popular Add-ons</option>
                </select>
            </FormRow>
            <FormRow>
                <Label htmlFor="connector" text="Feature Connector" helpText="Connector displayed before this feature" />
                <div className="md:col-span-2">
                    <div className="flex gap-4">
                        <label htmlFor="connector-and" className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                id="connector-and"
                                name="connector"
                                value="AND"
                                checked={formData.connector === 'AND'}
                                onChange={handleChange}
                                className="w-4 h-4 text-green-500 bg-gray-900 border-gray-600 focus:ring-green-500 focus:ring-offset-gray-800"
                                aria-label="connector-and"
                            />
                            <span className="text-green-400 font-semibold">AND</span>
                            <span className="text-gray-500 text-sm">(included together)</span>
                        </label>
                        <label htmlFor="connector-or" className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                id="connector-or"
                                name="connector"
                                value="OR"
                                checked={formData.connector === 'OR'}
                                onChange={handleChange}
                                className="w-4 h-4 text-yellow-500 bg-gray-900 border-gray-600 focus:ring-yellow-500 focus:ring-offset-gray-800"
                                aria-label="connector-or"
                            />
                            <span className="text-yellow-400 font-semibold">OR</span>
                            <span className="text-gray-500 text-sm">(choose one)</span>
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        This determines how this feature is displayed relative to the previous feature in packages.
                    </p>
                </div>
            </FormRow>

            {/* A La Carte Publishing Section */}
            <div className="pt-4 border-t border-gray-700/50 space-y-4">
                <h3 className="text-lg font-teko font-semibold text-gray-200 tracking-wider">A La Carte Publishing</h3>
                
                <FormRow>
                    <div className="md:col-span-3">
                        <label htmlFor="publishToAlaCarte" className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                id="publishToAlaCarte"
                                name="publishToAlaCarte"
                                checked={formData.publishToAlaCarte}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                            />
                            <span className="text-white font-semibold">Offer as A La Carte</span>
                        </label>
                        <p className="text-xs text-gray-500 mt-2 ml-8">
                            When enabled, this feature will be published to the customer-facing A La Carte menu with a separate price.
                        </p>
                    </div>
                </FormRow>

                {formData.publishToAlaCarte && (
                    <>
                        <FormRow>
                            <Label htmlFor="alaCartePrice" text="A La Carte Price ($)" required />
                            <input
                                type="number"
                                id="alaCartePrice"
                                name="alaCartePrice"
                                value={formData.alaCartePrice}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                                required={formData.publishToAlaCarte}
                            />
                        </FormRow>
                        <FormRow>
                            <Label htmlFor="alaCarteWarranty" text="A La Carte Warranty" helpText="(Optional override)" />
                            <input
                                type="text"
                                id="alaCarteWarranty"
                                name="alaCarteWarranty"
                                value={formData.alaCarteWarranty}
                                onChange={handleChange}
                                placeholder="Leave blank to use feature warranty"
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                            />
                        </FormRow>
                        <FormRow>
                            <div className="md:col-span-3">
                                <label htmlFor="alaCarteIsNew" className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="alaCarteIsNew"
                                        name="alaCarteIsNew"
                                        checked={formData.alaCarteIsNew}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
                                    />
                                    <span className="text-white font-semibold">Mark as "New" in A La Carte</span>
                                </label>
                            </div>
                        </FormRow>
                    </>
                )}
            </div>

            <FormRow>
                <Label htmlFor="points" text="Key Features" helpText="One per line" />
                <textarea
                    id="points"
                    name="points"
                    rows={4}
                    value={formData.points}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    placeholder="e.g., Extreme Gloss & Shine&#10;Hydrophobic Properties"
                />
            </FormRow>
            <FormRow>
                <Label htmlFor="useCases" text="Real-World Scenarios" helpText="One per line" />
                <textarea
                    id="useCases"
                    name="useCases"
                    rows={4}
                    value={formData.useCases}
                    onChange={handleChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                    placeholder="e.g., Water beads and rolls off the surface.&#10;Protects paint from fading."
                />
            </FormRow>

            {/* Media Section */}
            <div className="pt-4 border-t border-gray-700/50 space-y-4">
                <h3 className="text-lg font-teko font-semibold text-gray-200 tracking-wider">Media (Optional)</h3>

                {/* Image Upload */}
                <FormRow className="md:grid-cols-1">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-300">Product Image</p>
                        <p className="text-xs text-gray-500">Upload a high-quality image of the product</p>
                        <ImageUploader
                            onUploadComplete={(urls) => {
                                setFormData(prev => ({
                                    ...prev,
                                    imageUrl: urls.imageUrl,
                                    thumbnailUrl: urls.thumbnailUrl,
                                }));
                            }}
                            onUploadError={(errorMsg) => {
                                setError(errorMsg);
                            }}
                            existingImageUrl={formData.imageUrl}
                            maxSizeMB={5}
                        />
                    </div>
                </FormRow>

                {/* Manual URL Entry (Alternative) */}
                <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors">
                        Or enter image URLs manually
                    </summary>
                    <div className="mt-4 space-y-4 pl-4">
                        <FormRow>
                            <Label htmlFor="imageUrl" text="Image URL" helpText="Main product image" />
                            <input
                                type="url"
                                id="imageUrl"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                                placeholder="https://example.com/image.jpg"
                            />
                        </FormRow>

                        <FormRow>
                            <Label htmlFor="thumbnailUrl" text="Thumbnail URL" helpText="Small preview (optional)" />
                            <input
                                type="url"
                                id="thumbnailUrl"
                                name="thumbnailUrl"
                                value={formData.thumbnailUrl}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                                placeholder="https://example.com/thumbnail.jpg"
                            />
                        </FormRow>
                    </div>
                </details>

                <FormRow>
                    <Label htmlFor="videoUrl" text="Video URL" helpText="Product video (optional)" />
                    <input
                        type="url"
                        id="videoUrl"
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                        placeholder="https://youtube.com/watch?v=..."
                    />
                </FormRow>
            </div>

            <FormRow className="pt-4 border-t border-gray-700/50">
                <div className="md:col-start-2 md:col-span-2">
                     {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className="flex-1 bg-green-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : (isEditMode ? 'Update Feature' : 'Save Feature')}
                        </button>
                        {isEditMode && onCancelEdit && (
                            <button
                                type="button"
                                onClick={onCancelEdit}
                                disabled={isLoading}
                                className="px-6 py-2 bg-gray-700 text-white rounded-md font-bold text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </FormRow>
        </form>
    </div>
  );
};
