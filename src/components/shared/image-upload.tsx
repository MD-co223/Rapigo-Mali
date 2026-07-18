'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/store';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  label?: string;
}

function compressImage(file: File, maxW = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, maxSizeMB = 5, label = 'Images' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const maxSize = maxSizeMB * 1024 * 1024;

    for (const file of fileArr) {
      if (images.length >= maxImages) {
        toast.error(`Maximum ${maxImages} image(s) autorisée(s)`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Seuls les fichiers image sont acceptés');
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`L'image ${file.name} dépasse ${maxSizeMB} Mo`);
        continue;
      }

      try {
        setUploading(true);
        const base64 = await compressImage(file);
        const res = await apiFetch<{ url: string }>('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ image: base64 }),
        });
        if (res.data?.url) {
          onImagesChange([...images, res.data.url]);
        } else {
          toast.error(res.error || "Erreur lors de l'upload");
        }
      } catch {
        toast.error("Erreur lors du traitement de l'image");
      } finally {
        setUploading(false);
      }
    }
  }, [images, maxImages, maxSizeMB, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    onImagesChange(next);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Preview thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img + i} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100">
              <img src={img} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            </div>
          )}
        </div>
      )}

      {/* Upload controls — only show if under max */}
      {images.length < maxImages && !uploading && (
        <>
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={maxImages > 1}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {/* Desktop: drag & drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`hidden sm:flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
              dragOver
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50/50'
            }`}
          >
            <Upload className="h-8 w-8 text-emerald-600" />
            <div className="text-center">
              <p className="text-sm font-medium">Glisser-déposer ou cliquer pour choisir</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG — Max {maxSizeMB} Mo</p>
            </div>
          </div>

          {/* Mobile: camera + gallery buttons */}
          <div className="flex sm:hidden gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              Prendre une photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              Galerie
            </Button>
          </div>
        </>
      )}

      {images.length >= maxImages && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxImages} image(s) atteint(s)
        </p>
      )}
    </div>
  );
}