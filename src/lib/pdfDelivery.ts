/**
 * Universal Mobile/Desktop PDF Delivery Service
 *
 * Solves download issues on Android (WebView and Mobile Chrome)
 * by prioritizing Android's native Share Sheet (Web Share API) with fallback
 * to standard download, blob URL opening, and Data URI for APKs.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportPdfOptions {
  fileName: string;
  blob: Blob;
  title?: string;
  text?: string;
  onSuccess?: (mode: 'shared' | 'downloaded' | 'opened') => void;
  onError?: (error: any) => void;
}

/**
 * Converts a Blob to a base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al procesar el archivo PDF'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || dataUrl;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Checks if running on a native platform via Capacitor (Android / iOS APK)
 */
export function isCapacitorNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Checks if the current environment is running on Android or a mobile device
 */
export function isMobileOrAndroid(): boolean {
  if (isCapacitorNative()) return true;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}

/**
 * Checks if the current environment is Android specifically
 */
export function isAndroid(): boolean {
  if (isCapacitorNative()) {
    try {
      return Capacitor.getPlatform() === 'android';
    } catch {
      return true;
    }
  }
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /android/i.test(ua);
}

/**
 * Checks if the Web Share API supports sharing files directly
 */
export function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Triggers native download via <a> tag with blob URL
 */
export function triggerDirectDownload(blob: Blob, fileName: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup error
      }
    }, 2000);
    return true;
  } catch (err) {
    console.warn('Direct download anchor failed:', err);
    return false;
  }
}

/**
 * Master function to save or share a PDF file.
 *
 * Behavior:
 * 1. On Capacitor Android / iOS APK:
 *    - Converts Blob to Base64
 *    - Saves file to Cache / Documents using @capacitor/filesystem
 *    - Launches Android native Share Sheet / File Opener via @capacitor/share
 *      (allows saving to Downloads, Drive, WhatsApp, Adobe Acrobat, etc.)
 * 2. On Mobile Web (Chrome / Safari / TWA):
 *    - If Web Share API supports files, triggers navigator.share({ files: [file] })
 * 3. Fallback / Desktop:
 *    - Standard <a> download with blob URL
 *    - If that fails, window.open(blobUrl)
 */
export async function deliverPdfFile(options: {
  blob: Blob;
  fileName: string;
  title?: string;
  text?: string;
  preferShareOnMobile?: boolean;
}): Promise<{ success: boolean; mode: 'shared' | 'downloaded' | 'opened' }> {
  const {
    blob,
    fileName,
    title = fileName.replace(/\.pdf$/i, ''),
    text = 'Plan Nutricional NutriLuz en formato PDF de alta definición.',
    preferShareOnMobile = true,
  } = options;

  // 1. CAPACITOR NATIVE (APK en Android)
  if (isCapacitorNative()) {
    try {
      const base64Data = await blobToBase64(blob);

      // Guardar en la caché nativa de la app (no requiere permisos de almacenamiento externos)
      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Intentar también guardar en Documents para tener copia persistente
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (docErr) {
        // En algunas versiones Scoped Storage restringe Documents, el archivo en Cache ya está listo
        console.log('Notice saving to Documents folder:', docErr);
      }

      // Invocar menú nativo de Android (WhatsApp, Drive, Visor PDF, Guardar en Archivos)
      await Share.share({
        title,
        text,
        url: fileResult.uri,
        dialogTitle: 'Abrir o Guardar PDF',
      });

      return { success: true, mode: 'shared' };
    } catch (capErr: any) {
      console.warn('Capacitor native export result:', capErr);
      // Si el usuario canceló el diálogo de compartir de Android, es acción completada
      const isDismissed =
        capErr?.message?.toLowerCase().includes('canceled') ||
        capErr?.message?.toLowerCase().includes('cancelled') ||
        capErr?.name === 'AbortError';

      if (isDismissed) {
        return { success: true, mode: 'shared' };
      }
      // Si falló por alguna razón inesperada en Capacitor, continuar al fallback
    }
  }

  // 2. MOBILE WEB / TWA: Menú Compartir Nativo del navegador
  const isMobile = isMobileOrAndroid();
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (preferShareOnMobile && isMobile && canShareFiles(file)) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return { success: true, mode: 'shared' };
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return { success: true, mode: 'shared' };
      }
      console.warn('Web Share failed, falling back to direct download:', shareErr);
    }
  }

  // 3. DESKTOP / NAVEGADOR ESTÁNDAR: Descarga directa por <a>
  const downloadSuccess = triggerDirectDownload(blob, fileName);
  if (downloadSuccess) {
    return { success: true, mode: 'downloaded' };
  }

  // 4. Fallback final: Abrir en pestaña nueva
  try {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return { success: true, mode: 'opened' };
  } catch (openErr) {
    console.error('All PDF delivery mechanisms failed:', openErr);
    throw new Error('No fue posible descargar o compartir el archivo PDF.');
  }
}
