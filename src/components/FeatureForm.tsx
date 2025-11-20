import React, { useState, useEffect } from 'react';
import { addFeature, updateFeature } from '../data';
import { ImageUploader } from './ImageUploader';
import type { ProductFeature } from '../types';

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
  videoUrl: ''
};

export const FeatureForm: React.FC<FeatureFormProps> = ({ onSaveSuccess, editingFeature, onCancelEdit }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingFeature]);

  const isFormValid = formData.name && formData.price && formData.cost && formData.description;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        const featureData = {
            name: formData.name,
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost),
            description: formData.description,
            warranty: formData.warranty || '',
            points: formData.points.split('\n').filter(line => line.trim() !== ''),
            useCases: formData.useCases.split('\n').filter(line => line.trim() !== ''),
            ...(formData.imageUrl && { imageUrl: formData.imageUrl.trim() }),
            ...(formData.thumbnailUrl && { thumbnailUrl: formData.thumbnailUrl.trim() }),
            ...(formData.videoUrl && { videoUrl: formData.videoUrl.trim() }),
        };

        if (isNaN(featureData.price) || isNaN(featureData.cost)) {
            throw new Error("Price and Cost must be valid numbers.");
        }

        if (editingFeature) {
            // Update existing feature
            await updateFeature(editingFeature.id, featureData);
        } else {
            // Create new feature
            await addFeature(featureData);
        }

        setFormData(initialFormState); // Reset form on success
        onSaveSuccess();

    } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setError(null);
    if (onCancelEdit) {
      onCancelEdit();
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
        <h3 className="text-xl font-teko tracking-wider text-white mb-4">
          {editingFeature ? '✏️ Edit Feature' : '➕ Add New Feature'}
        </h3>
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
                            onUploadError={(error) => {
                                setError(error);
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
                        {editingFeature && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading || !isFormValid}
                            className="flex-1 bg-green-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Saving...' : (editingFeature ? 'Update Feature' : 'Save Feature')}
                        </button>
                    </div>
                </div>
            </FormRow>
        </form>
    </div>
  );
};
