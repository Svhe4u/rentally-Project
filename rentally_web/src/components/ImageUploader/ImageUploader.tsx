import { useState, useRef } from 'react';
import type { ListingImage } from '../../types';
import './ImageUploader.css';

interface ImageUploaderProps {
  images: ListingImage[];
  onImagesChange: (images: ListingImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onImagesChange, maxImages = 10 }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const totalFiles = filesToUpload.length;
    const uploadedImages: ListingImage[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // In a real app, you would upload to Cloudinary or your backend here
      // For now, we'll create a preview URL
      const imageUrl = URL.createObjectURL(file);

      uploadedImages.push({
        id: Date.now() + i,
        image_url: imageUrl,
        alt_text: file.name,
        is_primary: images.length === 0 && i === 0,
        order: images.length + i,
      });

      setUploadProgress(((i + 1) / totalFiles) * 100);
    }

    onImagesChange([...images, ...uploadedImages]);
    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: number) => {
    const newImages = images.filter(img => img.id !== id);
    onImagesChange(newImages);
  };

  const handleSetPrimary = (id: number) => {
    const newImages = images.map(img => ({
      ...img,
      is_primary: img.id === id,
    }));
    onImagesChange(newImages);
  };

  const handleReorder = (id: number, direction: 'up' | 'down') => {
    const index = images.findIndex(img => img.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];

    // Update order
    newImages.forEach((img, i) => {
      img.order = i;
    });

    onImagesChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="image-uploader">
      <div className="image-uploader-header">
        <span className="image-count">
          {images.length} / {maxImages} images
        </span>
        {canAddMore && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : '+ Add Images'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(uploadProgress)}%</span>
        </div>
      )}

      <div className="images-grid">
        {images.length === 0 ? (
          <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon">📷</div>
            <p>Click to upload images</p>
            <span>JPG, PNG up to 10MB each</span>
          </div>
        ) : (
          images.map((image, index) => (
            <div
              key={image.id}
              className={`image-item ${image.is_primary ? 'primary' : ''}`}
            >
              <img src={image.image_url} alt={image.alt_text || ''} />

              {image.is_primary && (
                <span className="primary-badge">Primary</span>
              )}

              <div className="image-actions">
                <button
                  className="image-action-btn"
                  onClick={() => handleSetPrimary(image.id)}
                  title="Set as primary"
                  disabled={image.is_primary}
                >
                  ★
                </button>
                <button
                  className="image-action-btn"
                  onClick={() => handleReorder(image.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  className="image-action-btn"
                  onClick={() => handleReorder(image.id, 'down')}
                  disabled={index === images.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  className="image-action-btn delete"
                  onClick={() => handleRemoveImage(image.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
