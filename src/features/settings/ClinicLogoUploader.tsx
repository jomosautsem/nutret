import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Zap,
  HardDrive,
  Cloud,
  FileCheck,
} from 'lucide-react';
import {
  optimizeImage,
  uploadLogoToSupabase,
  ImageOptimizationResult,
  SUPABASE_STORAGE_BUCKET_SQL,
} from '../../lib/imageOptimizer';
import { useToast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

interface ClinicLogoUploaderProps {
  currentLogoUrl: string;
  onLogoChange: (url: string) => void;
  primaryColor?: string;
}

export const ClinicLogoUploader: React.FC<ClinicLogoUploaderProps> = ({
  currentLogoUrl,
  onLogoChange,
  primaryColor = '#059669',
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'fallback'>('idle');
  const [optDetails, setOptDetails] = useState<{
    originalSize: number;
    compressedSize: number;
    savingsPct: number;
    dimensions: string;
    isSupabase: boolean;
  } | null>(null);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Format bytes for human readable display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileProcess = async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
      showToast('Formato No Válido', 'Por favor selecciona una imagen PNG, JPG, WebP o SVG.', 'error');
      return;
    }

    setIsProcessing(true);
    setUploadStatus('compressing');

    try {
      // 1. Client-side Image Optimization (max 600px, PNG with full alpha channel, high quality compression)
      const optResult: ImageOptimizationResult = await optimizeImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.90,
        format: file.type === 'image/svg+xml' ? undefined : 'image/png',
      });

      setUploadStatus('uploading');

      // 2. Upload to Supabase Storage 'clinic-assets' bucket
      const uploadRes = await uploadLogoToSupabase(
        optResult.blob,
        optResult.fileName,
        'clinic-assets'
      );

      if (uploadRes.success && uploadRes.publicUrl) {
        onLogoChange(uploadRes.publicUrl);
        setUploadStatus('success');
        setOptDetails({
          originalSize: optResult.originalSize,
          compressedSize: optResult.compressedSize,
          savingsPct: optResult.savingsPct,
          dimensions: `${optResult.width}x${optResult.height}px`,
          isSupabase: true,
        });

        showToast(
          'Logotipo Guardado en Supabase Cloud',
          `Imagen optimizada (${formatBytes(optResult.compressedSize)}, -${optResult.savingsPct}%) y subida exitosamente al almacenamiento en la nube.`,
          'success'
        );
      } else {
        // Fallback: Use optimized Base64 dataUrl locally so it works even if bucket is not created yet
        onLogoChange(optResult.dataUrl);
        setUploadStatus('fallback');
        setOptDetails({
          originalSize: optResult.originalSize,
          compressedSize: optResult.compressedSize,
          savingsPct: optResult.savingsPct,
          dimensions: `${optResult.width}x${optResult.height}px`,
          isSupabase: false,
        });

        if (uploadRes.isBucketMissing) {
          showToast(
            'Guardado Localmente (Bucket Pendiente)',
            'El logotipo se comprimió y guardó en tu sistema. Para guardarlo en la nube de Supabase, crea el bucket "clinic-assets" con el script SQL provisto.',
            'info'
          );
        } else {
          showToast(
            'Logotipo Optimizado y Guardado',
            `Guardado localmente (${formatBytes(optResult.compressedSize)}).`,
            'info'
          );
        }
      }
    } catch (err: any) {
      showToast('Error al Procesar Imagen', err.message || 'No se pudo optimizar la imagen.', 'error');
      setUploadStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange('');
    setOptDetails(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Logotipo Eliminado', 'Se ha removido el logotipo personalizado de la clínica.', 'info');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_STORAGE_BUCKET_SQL);
    setCopiedSql(true);
    showToast('Script SQL Copiado', 'Pégalo en el SQL Editor de tu panel de Supabase y haz clic en RUN.', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isSupabaseUrl = currentLogoUrl?.includes('supabase.co/storage/v1/object/public');
  const isBase64 = currentLogoUrl?.startsWith('data:image/');

  return (
    <div id="clinic-logo-uploader" className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block font-bold text-xs text-slate-800 dark:text-slate-200">
            Logotipo Oficial de la Clínica o Consultorio
          </label>
          <p className="text-[11px] text-slate-500">
            Se muestra en reportes PDF membretados, recetas clínicas, portal del paciente y barra lateral.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSqlModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Ver Script SQL Bucket Supabase</span>
        </button>
      </div>

      {/* Main Upload / Preview Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left / Top: Dropzone & File Button */}
        <div className="md:col-span-7">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`relative p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-400 hover:bg-white dark:hover:bg-slate-800/80'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <RefreshCw className="w-7 h-7 animate-spin" />
                <span className="text-xs font-bold">
                  {uploadStatus === 'compressing' ? 'Comprimiendo y optimizando imagen...' : 'Subiendo a Supabase Storage...'}
                </span>
                <span className="text-[10px] text-slate-500">Reduciendo peso sin perder nitidez...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    Arrastra aquí tu logotipo o haz clic para seleccionar
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Formatos recomendados: PNG (con transparencia), SVG, WebP o JPG
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Compresión inteligente automática (&lt;80 KB)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: Live Logo Preview Card */}
        <div className="md:col-span-5 bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Vista Previa
              </span>
              {currentLogoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
                  title="Quitar logotipo"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar</span>
                </button>
              )}
            </div>

            {/* Checkerboard container for alpha channel display */}
            <div
              className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 relative overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #e2e8f0 10%, transparent 11%), radial-gradient(circle, #e2e8f0 10%, transparent 11%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 8px 8px',
              }}
            >
              {currentLogoUrl ? (
                <img
                  src={currentLogoUrl}
                  alt="Logotipo de la clínica"
                  className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400 gap-1">
                  <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-[10px]">Sin logotipo asignado</span>
                </div>
              )}
            </div>
          </div>

          {/* Storage & Compression Badges */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
            {currentLogoUrl ? (
              <>
                <div className="flex items-center gap-1 font-semibold">
                  {isSupabaseUrl ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <Cloud className="w-3 h-3" /> Supabase Storage
                    </span>
                  ) : isBase64 ? (
                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                      <HardDrive className="w-3 h-3" /> Almacenamiento Local
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                      <FileCheck className="w-3 h-3" /> URL Externa
                    </span>
                  )}
                </div>

                {optDetails && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBytes(optDetails.compressedSize)} (-{optDetails.savingsPct}%)
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400 italic">Puedes subir un archivo o escribir una URL</span>
            )}
          </div>
        </div>
      </div>

      {/* Manual URL Input Alternative */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
          O escribe / pega directamente la URL del logotipo:
        </label>
        <div className="relative">
          <input
            type="text"
            value={currentLogoUrl}
            onChange={(e) => onLogoChange(e.target.value)}
            placeholder="https://qbhsmptpepxuuknwygdo.supabase.co/storage/v1/object/public/clinic-assets/..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white pr-20 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
          {currentLogoUrl && (
            <button
              type="button"
              onClick={() => onLogoChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* SQL Script Instructions Modal */}
      <Modal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        title="Creación del Bucket de Almacenamiento en Supabase"
        subtitle="Script SQL para configurar el bucket 'clinic-assets' y las políticas de acceso público"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instrucciones de Configuración en Supabase</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              1. Entra a tu Dashboard de <strong>Supabase</strong> (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold inline-flex items-center gap-0.5">supabase.com/dashboard <ExternalLink className="w-2.5 h-2.5" /></a>).<br />
              2. Ve a la pestaña <strong>SQL Editor</strong> en la barra lateral izquierda.<br />
              3. Pega el código de abajo y haz clic en <strong>RUN</strong> (Ejecutar).<br />
              4. ¡Listo! El bucket <code className="bg-emerald-200/60 dark:bg-emerald-900 px-1 rounded font-bold">clinic-assets</code> quedará creado con políticas públicas para logotipos y membretes.
            </p>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2 rounded-t-2xl border-b border-slate-800">
              <span className="font-mono text-[11px] font-bold text-slate-400">
                supabase_storage_clinic_assets.sql
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-b-2xl overflow-x-auto max-h-72 leading-relaxed scrollbar-thin border border-slate-900 border-t-0">
              {SUPABASE_STORAGE_BUCKET_SQL}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
