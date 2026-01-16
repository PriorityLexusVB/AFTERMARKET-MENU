import React, { useState, useEffect } from 'react';
import { addAlaCarteOption, updateAlaCarteOption } from '../data';
import type { AlaCarteOption, FeatureConnector } from '../types';

interface AlaCarteFormProps {
  onSaveSuccess: () => void;
  editingOption?: AlaCarteOption | null;
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
  isNew: false,
};

export const AlaCarteForm: React.FC<AlaCarteFormProps> = ({ onSaveSuccess, editingOption, onCancelEdit }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingOption;
  const isFormValid = formData.name && formData.price && formData.cost && formData.description;

  // Populate form when editing
  useEffect(() => {
    if (editingOption) {
      setFormData({
        name: editingOption.name,
        price: editingOption.price.toString(),
        cost: editingOption.cost.toString(),
        description: editingOption.description,
        warranty: editingOption.warranty || '',
        points: editingOption.points.join('\n'),
        useCases: (editingOption.useCases || []).join('\n'),
        imageUrl: editingOption.imageUrl || '',
        thumbnailUrl: editingOption.thumbnailUrl || '',
        videoUrl: editingOption.videoUrl || '',
        column: editingOption.column?.toString() || '',
        connector: editingOption.connector || 'AND',
        isNew: editingOption.isNew || false,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingOption]);

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
      // Validate numeric inputs before parsing
      const price = formData.price.trim();
      const cost = formData.cost.trim();

      // Check if price is a valid number
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        throw new Error("Price must be a valid non-negative number.");
      }

      // Check if cost is a valid number
      if (!cost || isNaN(parseFloat(cost)) || parseFloat(cost) < 0) {
        throw new Error("Cost must be a valid non-negative number.");
      }

      // Build the option data object with proper typing
      const optionData: Omit<AlaCarteOption, 'id'> = {
        name: formData.name,
        price: parseFloat(price),
        cost: parseFloat(cost),
        description: formData.description,
        points: formData.points.split('\n').filter(line => line.trim() !== ''),
        connector: formData.connector,
        ...(formData.warranty && { warranty: formData.warranty }),
        ...(formData.useCases && { useCases: formData.useCases.split('\n').filter(line => line.trim() !== '') }),
        ...(formData.imageUrl && { imageUrl: formData.imageUrl.trim() }),
        ...(formData.thumbnailUrl && { thumbnailUrl: formData.thumbnailUrl.trim() }),
        ...(formData.videoUrl && { videoUrl: formData.videoUrl.trim() }),
        ...(formData.isNew && { isNew: formData.isNew }),
      };

      // Add column if valid
      if (formData.column) {
        const parsedColumn = parseInt(formData.column);
        if (!isNaN(parsedColumn) && parsedColumn >= 1 && parsedColumn <= 4) {
          optionData.column = parsedColumn;
        }
      }

      if (isEditMode && editingOption) {
        // Update existing option
        await updateAlaCarteOption(editingOption.id, optionData);
      } else {
        // Add new option (position will be auto-assigned)
        await addAlaCarteOption(optionData);
      }

      // Reset form and notify parent
      setFormData(initialFormState);
      onSaveSuccess();
    } catch (error) {
      console.error("Error saving A La Carte option:", error);
      setError(error instanceof Error ? error.message : "An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setError(null);
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-lg">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-300 mb-1">
                Price <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-semibold text-gray-300 mb-1">
                Cost <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-300 mb-1">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="points" className="block text-sm font-semibold text-gray-300 mb-1">
            Key Points (one per line)
          </label>
          <textarea
            id="points"
            name="points"
            value={formData.points}
            onChange={handleChange}
            rows={4}
            placeholder="Enter key selling points, one per line"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="useCases" className="block text-sm font-semibold text-gray-300 mb-1">
            Use Cases (one per line)
          </label>
          <textarea
            id="useCases"
            name="useCases"
            value={formData.useCases}
            onChange={handleChange}
            rows={3}
            placeholder="Enter use cases, one per line"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="warranty" className="block text-sm font-semibold text-gray-300 mb-1">
            Warranty
          </label>
          <input
            type="text"
            id="warranty"
            name="warranty"
            value={formData.warranty}
            onChange={handleChange}
            placeholder="e.g., Lifetime coverage, 10 Year Warranty"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="column" className="block text-sm font-semibold text-gray-300 mb-1">
              Column Assignment
            </label>
            <select
              id="column"
              name="column"
              value={formData.column}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              <option value="1">Column 1 (Gold Package)</option>
              <option value="2">Column 2 (Elite Package)</option>
              <option value="3">Column 3 (Platinum Package)</option>
              <option value="4">Column 4 (Featured Add-ons)</option>
            </select>
          </div>

          <div>
            <label htmlFor="connector" className="block text-sm font-semibold text-gray-300 mb-1">
              Connector
            </label>
            <select
              id="connector"
              name="connector"
              value={formData.connector}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isNew"
            name="isNew"
            checked={formData.isNew}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
          />
          <label htmlFor="isNew" className="ml-2 text-sm font-semibold text-gray-300">
            Mark as "New" option
          </label>
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-300 mb-1">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="thumbnailUrl" className="block text-sm font-semibold text-gray-300 mb-1">
            Thumbnail URL (optional)
          </label>
          <input
            type="url"
            id="thumbnailUrl"
            name="thumbnailUrl"
            value={formData.thumbnailUrl}
            onChange={handleChange}
            placeholder="https://example.com/thumbnail.jpg"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="videoUrl" className="block text-sm font-semibold text-gray-300 mb-1">
            Video URL (optional)
          </label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          {onCancelEdit && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEditMode ? 'Update Option' : 'Add Option'}
          </button>
        </div>
      </form>
    </div>
  );
};
