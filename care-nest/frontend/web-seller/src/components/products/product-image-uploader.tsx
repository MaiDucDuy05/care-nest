'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { productsService } from '@/lib/services/products.service';

const MAX_PRODUCT_IMAGES = 8;

interface ProductImageUploaderProps {
  value: string[];
  onChange: (images: string[]) => void;
  label: string;
  selectImagesText: string;
  help: string;
  uploadingText: string;
  uploadFailedText: string;
  maxImagesText: string;
  removeImageText: string;
  onUploadingChange: (uploading: boolean) => void;
}

export function ProductImageUploader({
  value,
  onChange,
  label,
  selectImagesText,
  help,
  uploadingText,
  uploadFailedText,
  maxImagesText,
  removeImageText,
  onUploadingChange,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;

    if (value.length + files.length > MAX_PRODUCT_IMAGES) {
      setError(maxImagesText);
      return;
    }

    setError(null);
    setUploading(true);
    onUploadingChange(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        uploadedUrls.push(await productsService.uploadImage(file));
        onChange([...value, ...uploadedUrls]);
      }
    } catch {
      setError(uploadFailedText);
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={uploading || value.length >= MAX_PRODUCT_IMAGES}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={16} /> {uploading ? uploadingText : selectImagesText}
      </button>
      <p className="text-sm text-muted" style={{ marginTop: 6 }}>{help}</p>
      {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{error}</p>}

      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              style={{
                width: 92,
                height: 92,
                position: 'relative',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                aria-label={`${removeImageText} ${index + 1}`}
                title={removeImageText}
                onClick={() => onChange(value.filter((_, imageIndex) => imageIndex !== index))}
                disabled={uploading}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  display: 'grid',
                  placeItems: 'center',
                  padding: 0,
                  border: 0,
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
