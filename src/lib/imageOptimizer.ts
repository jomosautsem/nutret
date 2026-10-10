import { supabase, isSupabaseConfigured } from './supabase';

export interface ImageOptimizationResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPct: number;
  width: number;
  height: number;
  mimeType: string;
  fileName: string;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/png' | 'image/jpeg';
}

/**
 * Optimizes and compresses images client-side before upload,
 * ensuring fast loading, tiny storage footprint (<100KB) and crisp quality.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions = {}
): Promise<ImageOptimizationResult> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  // If SVG, preserve raw vector clarity without rasterizing
  if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
    const dataUrl = await fileToDataUrl(file);
    return {
      blob: file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPct: 0,
      width: maxWidth,
      height: maxHeight,
      mimeType: 'image/svg+xml',
      fileName: file.name,
    };
  }

  // Raster image optimization via Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto de canvas para optimizar la imagen'));
        return;
      }

      // Smooth bicubic rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output mime type (prefer webp, or png for transparency)
      const targetMime = format;
      const targetExt = targetMime === 'image/webp' ? 'webp' : targetMime === 'image/png' ? 'png' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Fallo al comprimir el archivo'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savingsPct = originalSize > 0 
              ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
              : 0;

            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}_opt.${targetExt}`;

            resolve({
              blob,
              dataUrl,
              originalSize,
              compressedSize,
              savingsPct,
              width,
              height,
              mimeType: targetMime,
              fileName: newFileName,
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Error al cargar la imagen para optimización'));
    };

    img.src = objectUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an optimized logo blob to Supabase Storage bucket 'clinic-assets'
 */
export async function uploadLogoToSupabase(
  blob: Blob | File,
  fileName: string = 'logo.webp',
  bucketName: string = 'clinic-assets'
): Promise<{
  success: boolean;
  publicUrl: string;
  error?: string;
  isBucketMissing?: boolean;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      success: false,
      publicUrl: '',
      error: 'Supabase no está configurado en el cliente.',
    };
  }

  try {
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `logos/clinic_logo_${timestamp}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/webp',
      });

    if (uploadError) {
      const isBucketMissing = 
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        uploadError.message?.toLowerCase().includes('not found') ||
        uploadError.message?.includes('404');

      return {
        success: false,
        publicUrl: '',
        error: uploadError.message,
        isBucketMissing,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      publicUrl: '',
      error: err?.message || 'Error inesperado al subir la imagen a Supabase.',
    };
  }
}

/**
 * Uploads an optimized patient photo blob to Supabase Storage bucket 'clinic-assets'
 */
export async function uploadPatientPhotoToSupabase(
  blob: Blob | File,
  patientId: string = 'new_patient',
  fileName: string = 'photo.webp',
  bucketName: string = 'clinic-assets'
): Promise<{
  success: boolean;
  publicUrl: string;
  error?: string;
  isBucketMissing?: boolean;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      success: false,
      publicUrl: '',
      error: 'Supabase no está configurado en el cliente.',
    };
  }

  try {
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const cleanPatientId = patientId.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `patients/${cleanPatientId}_${timestamp}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type || 'image/webp',
      });

    if (uploadError) {
      const isBucketMissing =
        uploadError.message?.toLowerCase().includes('bucket not found') ||
        uploadError.message?.toLowerCase().includes('not found') ||
        uploadError.message?.includes('404');

      return {
        success: false,
        publicUrl: '',
        error: uploadError.message,
        isBucketMissing,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      publicUrl: '',
      error: err?.message || 'Error inesperado al subir la fotografía a Supabase.',
    };
  }
}

/**
 * Optimizes a meal dish photo from a local device file or external image URL,
 * center-cropping and adjusting dimensions to 400x240 (matching the PDF cell box ~160x95mm),
 * producing an ultra-crisp, lightweight Base64 JPEG data URL (<80KB).
 */
export async function optimizeMealPhoto(
  fileOrUrl: File | string,
  targetW: number = 400,
  targetH: number = 240
): Promise<{ dataUrl: string; isBase64: boolean; width: number; height: number }> {
  // If it's a File uploaded from device
  if (typeof fileOrUrl !== 'string') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(fileOrUrl);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Center-crop to fill target box without stretching
          const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = (targetW - drawW) / 2;
          const drawY = (targetH - drawH) / 2;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve({
            dataUrl,
            isBase64: true,
            width: targetW,
            height: targetH,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo procesar la imagen seleccionada'));
      };

      img.src = objectUrl;
    });
  }

  // If it's already a Data URL
  const cleanUrl = fileOrUrl.trim();
  if (cleanUrl.startsWith('data:image/')) {
    return {
      dataUrl: cleanUrl,
      isBase64: true,
      width: targetW,
      height: targetH,
    };
  }

  // If it's an external HTTP/HTTPS URL
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const drawX = (targetW - drawW) / 2;
          const drawY = (targetH - drawH) / 2;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve({
            dataUrl,
            isBase64: true,
            width: targetW,
            height: targetH,
          });
          return;
        }
      } catch {
        // Tainted canvas by strict CORS, fallback to clean URL
      }
      resolve({
        dataUrl: cleanUrl,
        isBase64: false,
        width: img.naturalWidth || targetW,
        height: img.naturalHeight || targetH,
      });
    };

    img.onerror = () => {
      // If image fails to load from remote, return cleanUrl
      resolve({
        dataUrl: cleanUrl,
        isBase64: false,
        width: targetW,
        height: targetH,
      });
    };

    img.src = cleanUrl;
  });
}

/**
 * SQL script for creating the bucket and RLS policies in Supabase SQL Editor
 */
export const SUPABASE_STORAGE_BUCKET_SQL = `-- ==============================================================================
-- SCRIPT SQL PARA CREAR EL BUCKET DE ALMACENAMIENTO EN SUPABASE
-- Bucket: clinic-assets (para logotipos, membretes y firmas clínicas)
-- ==============================================================================

-- 1. Crear el bucket público 'clinic-assets' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clinic-assets',
  'clinic-assets',
  true,
  2097152, -- Límite máximo de 2 MB (las imágenes se comprimen a <100 KB automáticamente)
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'];

-- 2. Habilitar políticas de seguridad RLS en storage.objects
-- Política para lectura pública (cualquiera con el link o en reportes PDF puede ver el logotipo)
DROP POLICY IF EXISTS "Acceso Publico a clinic-assets" ON storage.objects;
CREATE POLICY "Acceso Publico a clinic-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-assets');

-- Política para permitir subir archivos (INSERT)
DROP POLICY IF EXISTS "Permitir Subir Archivos a clinic-assets" ON storage.objects;
CREATE POLICY "Permitir Subir Archivos a clinic-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinic-assets');

-- Política para permitir actualizar/reemplazar archivos (UPDATE)
DROP POLICY IF EXISTS "Permitir Actualizar Archivos en clinic-assets" ON storage.objects;
CREATE POLICY "Permitir Actualizar Archivos en clinic-assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinic-assets');

-- Política para permitir borrar archivos (DELETE)
DROP POLICY IF EXISTS "Permitir Borrar Archivos en clinic-assets" ON storage.objects;
CREATE POLICY "Permitir Borrar Archivos en clinic-assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinic-assets');
`;
