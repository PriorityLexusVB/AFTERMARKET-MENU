import React, { useState, useCallback, useRef } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../firebase';

interface ImageUploaderProps {
  onUploadComplete: (urls: { imageUrl: string; thumbnailUrl: string }) => void;
  onUploadError?: (error: string) => void;
  existingImageUrl?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  existingImageUrl,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (onUploadError) onUploadError(validationError);
      return;
    }

    if (!app) {
      const error = 'Firebase is not configured. Image upload requires Firebase Storage.';
      setError(error);
      if (onUploadError) onUploadError(error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage(app);

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filename = `product_images/${timestamp}_${sanitizedFilename}`;

      const storageRef = ref(storage, filename);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          const errorMessage = `Upload failed: ${error.message}`;
          setError(errorMessage);
          setUploading(false);
          if (onUploadError) onUploadError(errorMessage);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // For now, use the same URL for both image and thumbnail
            // In a production app, you'd generate a thumbnail server-side
            onUploadComplete({
              imageUrl: downloadURL,
              thumbnailUrl: downloadURL,
            });

            setPreviewUrl(downloadURL);
            setUploading(false);
            setUploadProgress(100);
          } catch (error) {
            console.error('Error getting download URL:', error);
            const errorMessage = 'Failed to get image URL after upload';
            setError(errorMessage);
            setUploading(false);
            if (onUploadError) onUploadError(errorMessage);
          }
        }
      );
    } catch (error) {
      console.error('Upload initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      setError(errorMessage);
      setUploading(false);
      if (onUploadError) onUploadError(errorMessage);
    }
  }, [maxSizeMB, acceptedFormats, onUploadComplete, onUploadError]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        handleFileUpload(file);
      }
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        handleFileUpload(file);
      }
    }
  }, [handleFileUpload]);

  // Handle click to open file picker
  const handleClick = useCallback(() => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }, [uploading]);

  // Handle remove image
  const handleRemoveImage = useCallback(async () => {
    if (previewUrl && app) {
      try {
        const storage = getStorage(app);
        const imageRef = ref(storage, previewUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Failed to delete image from storage:', error);
        // Continue even if deletion fails
      }
    }

    setPreviewUrl(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
          ${uploading ? 'cursor-not-allowed opacity-60' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        {/* Preview or Upload UI */}
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="mx-auto max-h-48 rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              disabled={uploading}
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mx-auto text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-gray-300 font-medium">
              {uploading ? 'Uploading...' : 'Drag & drop an image, or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              Max {maxSizeMB}MB • {acceptedFormats.map(f => f.split('/')[1]).join(', ').toUpperCase()}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">{uploadProgress.toFixed(0)}%</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};
