import { useState, useRef } from 'react';
import type { ListingImage } from '../../types';
import './ImageUploader.css';

export interface UploadImageMeta {
  order: number;
  isPrimary: boolean;
}

interface ImageUploaderProps {
  images: ListingImage[];
  onImagesChange: (images: ListingImage[]) => void;
  uploadImage: (file: File, meta: UploadImageMeta) => Promise<ListingImage>;
  onRemoveImage?: (image: ListingImage) => Promise<void>;
  onPersistImages?: (images: ListingImage[]) => Promise<void>;
  onUploadError?: (message: string) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onImagesChange,
  uploadImage,
  onRemoveImage,
  onPersistImages,
  onUploadError,
  maxImages = 10,
}: ImageUploaderProps) {
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

    const totalFiles = filesToUpload.length;
    const uploadedImages: ListingImage[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const order = images.length + i;
        const isPrimary = images.length === 0 && i === 0;
        const listingImg = await uploadImage(file, { order, isPrimary });
        uploadedImages.push(listingImg);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      onImagesChange([...images, ...uploadedImages]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Зураг хуулахад алдаа гарлаа';
      onUploadError?.(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (id: number) => {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    try {
      if (onRemoveImage) {
        await onRemoveImage(img);
      }
      const normalized = images
        .filter((i) => i.id !== id)
        .map((row, idx) => ({ ...row, order: idx }));
      onImagesChange(normalized);
      await onPersistImages?.(normalized);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Зураг устгахад алдаа гарлаа';
      onUploadError?.(message);
    }
  };

  const handleSetPrimary = async (id: number) => {
    const newImages = images.map((img) => ({
      ...img,
      is_primary: img.id === id,
    }));
    onImagesChange(newImages);
    try {
      await onPersistImages?.(newImages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Өөрчлөхөд алдаа гарлаа';
      onUploadError?.(message);
    }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    const index = images.findIndex((img) => img.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const reordered = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const withOrder = reordered.map((img, i) => ({ ...img, order: i }));

    onImagesChange(withOrder);
    try {
      await onPersistImages?.(withOrder);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Дараалал өөрчлөхөд алдаа гарлаа';
      onUploadError?.(message);
    }
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="image-uploader">
      <div className="image-uploader-header">
        <span className="image-count">
          {images.length} / {maxImages} зураг
        </span>
        {canAddMore && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Хуулж байна...' : '+ Зураг нэмэх'}
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
          <div className="upload-placeholder" onClick={() => !isUploading && fileInputRef.current?.click()}>
            <div className="upload-icon">📷</div>
            <p>Зураг хуулах бол дарна уу</p>
            <span>JPG, PNG 10MB хүртэл</span>
          </div>
        ) : (
          images.map((image, index) => (
            <div
              key={image.id}
              className={`image-item ${image.is_primary ? 'primary' : ''}`}
            >
              <img src={image.image_url} alt={image.alt_text || ''} />

              {image.is_primary && (
                <span className="primary-badge">Үндсэн</span>
              )}

              <div className="image-actions">
                <button
                  type="button"
                  className="image-action-btn"
                  onClick={() => handleSetPrimary(image.id)}
                  title="Үндсэн болгох"
                  disabled={image.is_primary}
                >
                  ★
                </button>
                <button
                  type="button"
                  className="image-action-btn"
                  onClick={() => handleReorder(image.id, 'up')}
                  disabled={index === 0}
                  title="Дээшлүүлэх"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="image-action-btn"
                  onClick={() => handleReorder(image.id, 'down')}
                  disabled={index === images.length - 1}
                  title="Доошлуулах"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="image-action-btn delete"
                  onClick={() => handleRemoveImage(image.id)}
                  title="Устгах"
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
