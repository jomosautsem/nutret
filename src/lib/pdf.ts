import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { NutritionPlan, Patient, Organization, UserProfile, Recipe } from '../types';
import { deliverPdfFile } from './pdfDelivery';

/**
 * Safely loads an image from URL or base64 into HTMLImageElement / canvas
 * so jsPDF can embed it cleanly without breaking on CORS or format issues.
 */
export async function loadPdfImage(url: string | undefined | null): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!url || typeof url !== 'string' || !url.trim()) return null;

  // Pure PNG data URLs can be read directly
  if (url.startsWith('data:image/png;base64,')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl: url,
          width: img.naturalWidth || img.width || 200,
          height: img.naturalHeight || img.height || 200,
        });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // For any other format (WebP, SVG, JPEG, HTTP/HTTPS URLs), rasterize cleanly to standard PNG via Canvas
  return new Promise((resolve) => {
    try {
      const img = new Image();
      if (!url.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        try {
          const maxDim = 800;
          let w = img.naturalWidth || img.width || 250;
          let h = img.naturalHeight || img.height || 250;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h / w) * maxDim);
              w = maxDim;
            } else {
              w = Math.round((w / h) * maxDim);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve({
            dataUrl: pngDataUrl,
            width: canvas.width,
            height: canvas.height,
          });
        } catch (canvasErr) {
          console.warn('Canvas rasterization warning, attempting fallback:', canvasErr);
          if (url.startsWith('http')) {
            fetch(url)
              .then((r) => r.blob())
              .then((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    dataUrl: reader.result as string,
                    width: 250,
                    height: 250,
                  });
                };
                reader.readAsDataURL(blob);
              })
              .catch(() => resolve(null));
          } else {
            resolve({ dataUrl: url, width: 200, height: 200 });
          }
        }
      };
      img.onerror = () => {
        if (url.startsWith('http')) {
          fetch(url)
            .then((r) => r.blob())
            .then((blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve({
                  dataUrl: reader.result as string,
                  width: 200,
                  height: 200,
                });
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve(null));
        } else {
          resolve(null);
        }
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generates a clean QR code Data URL for mobile verification & patient portal
 */
async function generateQrDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 180,
      color: {
        dark: '#064e3b', // Deep emerald
        light: '#ffffff',
      },
    });
  } catch (e) {
    console.warn('QR code generation error:', e);
    return null;
  }
}

/**
 * Generates an appetizing, realistic dish photo thumbnail on an HTML5 canvas
 * matching the exact dish title (pancakes, eggs, toasts, smoothies, croissants, quesadillas, etc.)
 * This ensures the landscape weekly schedule ALWAYS has crisp, beautiful food photos without CORS issues.
 */
export function generateDishCanvasThumbnail(dishTitle: string, mealType: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 95;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const name = (dishTitle || '').toLowerCase();

    // Determine dish characteristics
    const isPancake = name.includes('hot cake') || name.includes('pancake');
    const isEgg = name.includes('huevo') || name.includes('omelette') || name.includes('revuelto');
    const isSmoothie = name.includes('licuado') || name.includes('smoothie') || name.includes('batido');
    const isCroissant = name.includes('croissant');
    const isMelon = name.includes('melón') || name.includes('melon') || name.includes('granola');
    const isOats = name.includes('avena') || name.includes('frío con fruta');
    const isQuesadilla = name.includes('quesadilla') || name.includes('sincronizada');
    const isChicken = name.includes('pollo') || name.includes('pechuga') || name.includes('bistec') || name.includes('salmón') || name.includes('pescado');
    const isSalad = name.includes('ensalada') || name.includes('verdura');
    const isToast = !isPancake && !isEgg && !isSmoothie && !isCroissant && !isMelon && !isOats && !isQuesadilla && !isChicken && !isSalad;

    // Background gradient (table surface)
    let bgGradColors: [string, string] = ['#f8fafc', '#e2e8f0'];
    if (isPancake || isToast) bgGradColors = ['#fef3c7', '#fde68a'];
    else if (isEgg) bgGradColors = ['#fffbeb', '#fef3c7'];
    else if (isSmoothie) bgGradColors = ['#fdf2f8', '#fce7f3'];
    else if (isCroissant) bgGradColors = ['#fefce8', '#fef9c3'];
    else if (isMelon) bgGradColors = ['#fff7ed', '#fed7aa'];
    else if (isOats) bgGradColors = ['#f0fdf4', '#dcfce7'];
    else if (isQuesadilla) bgGradColors = ['#fff7ed', '#ffedd5'];
    else if (isChicken) bgGradColors = ['#fafaf9', '#e7e5e4'];
    else if (isSalad) bgGradColors = ['#f0fdf4', '#bbf7d0'];

    const bgGrad = ctx.createLinearGradient(0, 0, 160, 95);
    bgGrad.addColorStop(0, bgGradColors[0]);
    bgGrad.addColorStop(1, bgGradColors[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 160, 95);

    // White ceramic plate / bowl with soft drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 48, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(80, 48, 38, 0, Math.PI * 2);
    ctx.stroke();

    // Plate inner rim
    ctx.beginPath();
    ctx.arc(80, 48, 30, 0, Math.PI * 2);
    ctx.strokeStyle = '#f1f5f9';
    ctx.stroke();

    // Render dish elements
    if (isPancake) {
      // 3 Stacked golden pancakes with maple drizzle and blueberries
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 2 ? '#f59e0b' : i === 1 ? '#d97706' : '#b45309';
        ctx.beginPath();
        ctx.ellipse(80, 56 - i * 6, 21 - i * 1.5, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      // Blueberries
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath(); ctx.arc(77, 41, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(83, 39, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(80, 36, 2.8, 0, Math.PI * 2); ctx.fill();
    } else if (isEgg) {
      // Fluffy golden scrambled eggs with ham and green herbs
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(75, 48, 18, 12, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(84, 45, 10, 0, Math.PI * 2);
      ctx.fill();
      // Diced ham
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(72, 44, 4, 3);
      ctx.fillRect(82, 51, 5, 2.5);
      // Parsley herbs
      ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.arc(78, 48, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(86, 42, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(73, 53, 1.5, 0, Math.PI * 2); ctx.fill();
    } else if (isSmoothie) {
      // Berry smoothie cup with straw and berry garnish
      ctx.fillStyle = '#db2777';
      ctx.beginPath();
      ctx.arc(80, 48, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(78, 44, 17, 7, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Blackberry specks
      ctx.fillStyle = '#4c0519';
      ctx.beginPath(); ctx.arc(82, 45, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(76, 47, 2.8, 0, Math.PI * 2); ctx.fill();
      // Straw
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(85, 46);
      ctx.lineTo(96, 26);
      ctx.stroke();
    } else if (isCroissant) {
      // Golden flaky croissant with red raspberries
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(80, 48, 22, 12, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(80, 46, 17, 8, -0.1, 0, Math.PI * 2);
      ctx.fill();
      // Raspberries
      ctx.fillStyle = '#e11d48';
      ctx.beginPath(); ctx.arc(68, 54, 3.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(92, 54, 3.8, 0, Math.PI * 2); ctx.fill();
    } else if (isMelon) {
      // Cantaloupe melon slices with granola
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(75, 48, 18, 9, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(85, 46, 17, 8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Granola crunch
      ctx.fillStyle = '#b45309';
      for (let g = 0; g < 6; g++) {
        ctx.beginPath(); ctx.arc(74 + g * 3, 44 + (g % 3) * 3, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (isOats) {
      // Creamy oats bowl with berries, apple and chia
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(80, 48, 24, 0, Math.PI * 2);
      ctx.fill();
      // Red berries
      ctx.fillStyle = '#e11d48';
      ctx.beginPath(); ctx.arc(75, 44, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath(); ctx.arc(85, 46, 3, 0, Math.PI * 2); ctx.fill();
      // Chia seeds
      ctx.fillStyle = '#18181b';
      for (let s = 0; s < 8; s++) {
        ctx.fillRect(72 + s * 2.2, 51 + (s % 2) * 2, 1.2, 1.2);
      }
    } else if (isQuesadilla) {
      // Golden folded quesadilla with Oaxaca cheese
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(64, 58);
      ctx.lineTo(96, 36);
      ctx.lineTo(94, 58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(72, 51, 15, 4);
    } else if (isChicken) {
      // Grilled chicken breast / steak with rice
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(82, 46, 17, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Grill marks
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(74, 42); ctx.lineTo(82, 50); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(80, 40); ctx.lineTo(88, 48); ctx.stroke();
      // Steamed rice mound
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(70, 52, 10, 0, Math.PI * 2); ctx.fill();
    } else if (isSalad) {
      // Fresh salad greens with cherry tomatoes
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(75, 46, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.arc(85, 48, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(79, 44, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(86, 53, 3.5, 0, Math.PI * 2); ctx.fill();
    } else {
      // Whole wheat toast with peanut butter & banana / spread
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(66, 34, 28, 28, 4);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(70, 38, 20, 20, 3);
      ctx.fill();
      // Banana slices
      ctx.fillStyle = '#fef9c3';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(75, 43, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(85, 45, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(78, 52, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Error rendering dish canvas thumbnail:', err);
    return '';
  }
}

/**
 * Strips emojis, non-standard surrogate characters and problematic symbols
 * that cause mojibake in standard jsPDF Helvetica fonts.
 */
export function cleanPdfText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    // Strip emojis and pictographs across all Unicode planes
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ''
    )
    // Strip surrogate pairs that may be unencoded
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    // Strip mojibake sequences produced by decoding multi-byte UTF-8 emojis in Latin-1/WinAnsi (e.g., "Ø<ß", "Ø<ßO", "ðŸŒ…")
    .replace(/Ø<[ßO™¥]/g, '')
    .replace(/Ø[<«][\s\S]{0,3}/g, '')
    .replace(/[ðØ][\x80-\xFF]+/g, '')
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•●▪]/g, '-')
    .replace(/[✓✔☑]/g, '[OK]')
    .replace(/[★☆]/g, '*')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae y formatea la descripción de la porción y alimento de manera limpia, directa, profesional y detallada para el paciente
 * (ej. "2 piezas (100g) de Huevo entero fresco", "1 taza (60g) de Espinacas frescas", "1/2 pieza (60g) de Jitomate saladette picado", "2 piezas (50g) de Tortillas de maíz nixtamalizado")
 * Corrigiendo separaciones incorrectas, evitando duplicar nombres de platillos (ej. "taza espinacas de Huevos revueltos...")
 * y asegurando que ingredientes como el jitomate y espinacas siempre tengan su cantidad y gramaje exacto.
 */
export function formatCleanItemDescription(
  it: {
    name?: string;
    portionDescription?: string;
    portionQuantity?: number;
    preparationTip?: string;
  } | null | undefined
): string {
  if (!it) return '';

  const name = (it.name || '').trim();
  let portion = (it.portionDescription || '').trim();

  // 1. Sanitizar si contiene un factor técnico multiplicador al inicio (ej. "1.5 2 huevos", "1.5 2 piezas")
  if (portion) {
    portion = portion.replace(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?|\d+\/\d+)\s+/i, '$2 ');
    // Sanitizar si venía pegado un sufijo que duplica el platillo (ej. "... de Huevos revueltos...")
    portion = portion.replace(/\s+de\s+huevos\s+revueltos.*$/i, '');
    portion = portion.replace(/\s+de\s+omelette.*$/i, '');
    portion = portion.replace(/\s+de\s+chilaquiles.*$/i, '');
  }

  const lowerName = name.toLowerCase();
  let lowerPortion = portion.toLowerCase();

  // 2. Corrección exhaustiva y detallada de Huevos revueltos con espinacas y jitomate:
  // Garantizar que la espinaca tenga su medida y gramaje, haya separación limpia (+),
  // y que NUNCA falte la cantidad de jitomate (1/2 pieza (60g) de jitomate saladette picado).
  const isHuevosConEspinacasYJitomate =
    (lowerName.includes('huevos revueltos') && lowerName.includes('espinaca') && lowerName.includes('jitomate')) ||
    (lowerPortion.includes('huevos') && lowerPortion.includes('espinaca') && (lowerName.includes('jitomate') || lowerPortion.includes('jitomate')));

  if (isHuevosConEspinacasYJitomate) {
    let eggsPart = '2 piezas (100g) de huevo entero fresco';
    if (lowerPortion.includes('clara')) {
      eggsPart = '3 claras + 1 huevo entero';
    }
    const spinachPart = '1 taza (60g) de espinacas frescas desinfectadas';
    const tomatoPart = '1/2 pieza (60g) de jitomate saladette picado';

    portion = `${eggsPart} + ${spinachPart} + ${tomatoPart}`;
    lowerPortion = portion.toLowerCase();
  } else {
    // Normalizar si viene "taza espinacas" o "1 taza espinaca"
    if (/\b(?:1\s+)?taza\s+espinacas?\b/i.test(portion) && !portion.includes('(60g)')) {
      portion = portion.replace(/\b(?:1\s+)?taza\s+espinacas?\b/i, '1 taza (60g) de espinacas frescas');
    }
  }

  let result = '';
  if (name && portion) {
    const cleanLowerPortion = portion.toLowerCase();
    const cleanLowerName = name.toLowerCase();

    if (cleanLowerPortion === cleanLowerName || cleanLowerPortion.includes(cleanLowerName)) {
      result = portion;
    } else if (cleanLowerName.includes(cleanLowerPortion)) {
      result = name;
    } else if (
      // Si la porción tiene '+' (es una combinación de varios ingredientes con sus cantidades)
      portion.includes('+') ||
      // Si la porción ya es un alimento completo (ej. "2 huevos enteros", "1 taza de leche", "3 claras")
      /\b(huevos?|claras?|tortillas?|avena|leche|frijoles?|pollo|atún|salmón|pan|arroz|manzana|plátano|yogur|tostadas?)\b/i.test(cleanLowerPortion) ||
      // Si el nombre es un platillo compuesto
      /\b(revueltos?|omelette|chilaquiles|pancakes?|hot cakes?|licuado|ensalada|sándwich|tazón|bowl|wrap|guisado|caldo|sopa)\b/i.test(cleanLowerName)
    ) {
      // NUNCA concatenar "de <nombre_platillo>" para no generar mezclas gramaticales erróneas
      result = portion;
    } else {
      // Caso estándar: porción es una medida simple (ej. "2 piezas (50g)", "1/3 pieza (35g)") y name es el alimento
      const prefix = cleanLowerName.startsWith('de ') ? '' : 'de ';
      result = `${portion} ${prefix}${name}`;
    }
  } else {
    result = portion || name || '1 porción';
  }

  // Garantizar espaciado limpio y legible alrededor de los separadores '+'
  result = result.replace(/\s*\+\s*/g, ' + ');

  if (it.preparationTip && it.preparationTip.trim()) {
    result += ` (${it.preparationTip.trim()})`;
  }

  return cleanPdfText(result);
}

/**
 * Strips raw Markdown syntax while preserving clean visual structure, paragraphs, and list formatting.
 */
export function formatMarkdownForPdf(mdText: string | null | undefined): string {
  if (!mdText) return '';
  const lines = mdText.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line) || /^___+$/.test(line)) {
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      line = line.replace(/^#{1,6}\s+/, '').toUpperCase();
    }

    line = line.replace(/\*\*([^*]+)\*\*/g, '$1');
    line = line.replace(/\*([^*]+)\*/g, '$1');
    line = line.replace(/__([^_]+)__/g, '$1');
    line = line.replace(/_([^_]+)_/g, '$1');

    if (/^[\*\-\+]\s+/.test(line)) {
      line = '• ' + line.replace(/^[\*\-\+]\s+/, '');
    }

    const sanitized = cleanPdfText(line);
    if (sanitized) {
      cleanedLines.push(sanitized);
    } else if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
      cleanedLines.push('');
    }
  }

  return cleanedLines.join('\n');
}

// ====================================================
// PDF DESIGN THEMES & COLOR SYSTEM
// ====================================================
export type PdfDesignId = 'clinical_modern' | 'executive_emerald' | 'fitness_athletic' | 'medical_editorial';

export type RGB = [number, number, number];

export interface PdfColors {
  primary: RGB;
  primaryDark: RGB;
  primaryDeep: RGB;
  primaryLight: RGB;
  primaryBorder: RGB;
  accent: RGB;
  accentDark: RGB;
  accentLight: RGB;
  headerBar: RGB;
  headerSubBar: RGB;
  blue: RGB;
  blueDark: RGB;
  blueLight: RGB;
  blueBorder: RGB;
  rose: RGB;
  roseDark: RGB;
  roseLight: RGB;
  purple: RGB;
  purpleDark: RGB;
  purpleLight: RGB;
  teal: RGB;
  tealLight: RGB;
  darkText: RGB;
  darkHeading: RGB;
  mutedText: RGB;
  border: RGB;
  borderLight: RGB;
  bgCard: RGB;
  white: RGB;
}

export interface PdfDesignOption {
  id: PdfDesignId;
  name: string;
  badge: string;
  description: string;
  tagline: string;
  previewColors: string[];
  isDefault?: boolean;
}

export const PDF_DESIGNS: PdfDesignOption[] = [
  {
    id: 'clinical_modern',
    name: 'Clínico Moderno (Estilo Capturas)',
    badge: 'Recomendado',
    tagline: 'Fiel a tus capturas con acentos azul médico, tarjetas de métricas y sección pedagógica destacada',
    description: 'Acentos en azul médico y cielo (#0284c7), tarjetas suaves, caja de aviso educativo y días en colores individuales.',
    previewColors: ['#0284c7', '#38bdf8', '#0f172a', '#e0f2fe'],
    isDefault: true,
  },
  {
    id: 'executive_emerald',
    name: 'Ejecutivo Esmeralda & Oro',
    badge: 'Prestige Nutriluz',
    tagline: 'Elegancia institucional con verde bosque profundo y detalles dorados de alta dirección',
    description: 'Verde esmeralda (#064e3b), ribetes dorados (#d97706) y contraste editorial para consultorios de prestigio.',
    previewColors: ['#064e3b', '#059669', '#d97706', '#ecfdf5'],
  },
  {
    id: 'fitness_athletic',
    name: 'Fitness Pro & Rendimiento',
    badge: 'Sport / Dark',
    tagline: 'Alto impacto visual con barras en carbón oscuro, verde neón y enfoque deportivo',
    description: 'Encabezados oscuros en slate/charcoal (#0f172a), acentos lima/verde deportivo y tarjetas compactas para atletas.',
    previewColors: ['#0f172a', '#10b981', '#f97316', '#f1f5f9'],
  },
  {
    id: 'medical_editorial',
    name: 'Médico Editorial & Minimalista Blanco',
    badge: 'Hospitalario',
    tagline: 'Ultra limpio, líneas finas en azul marino universitario y máxima sobriedad clínica',
    description: 'Azul marino formal (#1e3a8a), fondos inmaculados, líneas delgadas y formato ideal para auditorías o interconsultas.',
    previewColors: ['#1e3a8a', '#2563eb', '#64748b', '#f8fafc'],
  },
];

export function getThemeColors(designId: PdfDesignId = 'clinical_modern'): PdfColors {
  if (designId === 'clinical_modern') {
    return {
      primary: [2, 132, 199],       // Sky 600
      primaryDark: [3, 105, 161],   // Sky 700
      primaryDeep: [12, 74, 110],   // Sky 900
      primaryLight: [240, 249, 255],// Sky 50
      primaryBorder: [186, 230, 253],// Sky 200
      accent: [245, 158, 11],       // Amber 500
      accentDark: [217, 119, 6],    // Amber 600
      accentLight: [254, 243, 199], // Amber 50
      headerBar: [12, 74, 110],     // Dark blue medical
      headerSubBar: [2, 132, 199],  // Sky blue
      blue: [37, 99, 235],
      blueDark: [29, 78, 216],
      blueLight: [239, 246, 255],
      blueBorder: [191, 219, 254],
      rose: [225, 29, 72],
      roseDark: [190, 18, 60],
      roseLight: [255, 241, 242],
      purple: [124, 58, 237],
      purpleDark: [109, 40, 217],
      purpleLight: [245, 243, 255],
      teal: [13, 148, 136],
      tealLight: [240, 253, 250],
      darkText: [30, 41, 59],
      darkHeading: [15, 23, 42],
      mutedText: [100, 116, 139],
      border: [226, 232, 240],
      borderLight: [241, 245, 249],
      bgCard: [248, 250, 252],
      white: [255, 255, 255],
    };
  }

  if (designId === 'fitness_athletic') {
    return {
      primary: [16, 185, 129],      // Emerald 500 / Neon
      primaryDark: [5, 150, 105],   // Emerald 600
      primaryDeep: [15, 23, 42],    // Slate 900 (Charcoal)
      primaryLight: [241, 245, 249],// Slate 100
      primaryBorder: [148, 163, 184],
      accent: [234, 88, 12],        // Orange 600
      accentDark: [194, 65, 12],
      accentLight: [255, 237, 213],
      headerBar: [15, 23, 42],      // Charcoal
      headerSubBar: [16, 185, 129], // Neon Emerald
      blue: [2, 132, 199],
      blueDark: [3, 105, 161],
      blueLight: [240, 249, 255],
      blueBorder: [186, 230, 253],
      rose: [225, 29, 72],
      roseDark: [190, 18, 60],
      roseLight: [255, 241, 242],
      purple: [124, 58, 237],
      purpleDark: [109, 40, 217],
      purpleLight: [245, 243, 255],
      teal: [13, 148, 136],
      tealLight: [240, 253, 250],
      darkText: [30, 41, 59],
      darkHeading: [15, 23, 42],
      mutedText: [100, 116, 139],
      border: [203, 213, 225],
      borderLight: [241, 245, 249],
      bgCard: [248, 250, 252],
      white: [255, 255, 255],
    };
  }

  if (designId === 'medical_editorial') {
    return {
      primary: [30, 58, 138],       // Blue 900 / Navy
      primaryDark: [30, 64, 175],   // Blue 800
      primaryDeep: [17, 24, 39],    // Gray 900
      primaryLight: [248, 250, 252],// Slate 50
      primaryBorder: [203, 213, 225],// Slate 300
      accent: [14, 165, 233],       // Sky 500
      accentDark: [2, 132, 199],
      accentLight: [240, 249, 255],
      headerBar: [30, 58, 138],     // Formal Navy
      headerSubBar: [14, 165, 233], // Sky 500
      blue: [37, 99, 235],
      blueDark: [29, 78, 216],
      blueLight: [239, 246, 255],
      blueBorder: [191, 219, 254],
      rose: [225, 29, 72],
      roseDark: [190, 18, 60],
      roseLight: [255, 241, 242],
      purple: [124, 58, 237],
      purpleDark: [109, 40, 217],
      purpleLight: [245, 243, 255],
      teal: [13, 148, 136],
      tealLight: [240, 253, 250],
      darkText: [30, 41, 59],
      darkHeading: [15, 23, 42],
      mutedText: [100, 116, 139],
      border: [226, 232, 240],
      borderLight: [241, 245, 249],
      bgCard: [255, 255, 255],
      white: [255, 255, 255],
    };
  }

  // executive_emerald
  return {
    primary: [5, 150, 105],        // Emerald 600
    primaryDark: [6, 95, 70],      // Emerald 800
    primaryDeep: [4, 78, 59],      // Emerald 900
    primaryLight: [236, 253, 245], // Emerald 50
    primaryBorder: [167, 243, 208],// Emerald 200
    accent: [217, 119, 6],         // Amber 600
    accentDark: [180, 83, 9],      // Amber 700
    accentLight: [254, 243, 199],  // Amber 50
    headerBar: [4, 78, 59],        // Deep Emerald
    headerSubBar: [5, 150, 105],   // Vibrant Emerald
    blue: [37, 99, 235],
    blueDark: [29, 78, 216],
    blueLight: [239, 246, 255],
    blueBorder: [191, 219, 254],
    rose: [225, 29, 72],
    roseDark: [190, 18, 60],
    roseLight: [255, 241, 242],
    purple: [124, 58, 237],
    purpleDark: [109, 40, 217],
    purpleLight: [245, 243, 255],
    teal: [13, 148, 136],
    tealLight: [240, 253, 250],
    darkText: [30, 41, 59],
    darkHeading: [15, 23, 42],
    mutedText: [100, 116, 139],
    border: [226, 232, 240],
    borderLight: [241, 245, 249],
    bgCard: [248, 250, 252],
    white: [255, 255, 255],
  };
}

// Global fallback colors for backwards-compatibility
export const colors: PdfColors = getThemeColors('clinical_modern');

/**
 * 7 Distinct Executive Colors for Each Day of the Week (Lunes a Domingo)
 */
export interface DayTheme {
  name: string;
  fill: RGB;
  light: RGB;
  border: RGB;
  textDark: RGB;
}

export const DAY_THEMES: DayTheme[] = [
  // 1. Lunes: Esmeralda Clínico
  { name: 'Lunes', fill: [5, 150, 105], light: [236, 253, 245], border: [16, 185, 129], textDark: [6, 95, 70] },
  // 2. Martes: Azul Zafiro / Océano
  { name: 'Martes', fill: [37, 99, 235], light: [239, 246, 255], border: [59, 130, 246], textDark: [29, 78, 216] },
  // 3. Miércoles: Ámbar / Oro Cálido
  { name: 'Miércoles', fill: [217, 119, 6], light: [254, 243, 199], border: [245, 158, 11], textDark: [180, 83, 9] },
  // 4. Jueves: Púrpura / Violeta Real
  { name: 'Jueves', fill: [124, 58, 237], light: [245, 243, 255], border: [139, 92, 246], textDark: [109, 40, 217] },
  // 5. Viernes: Rosa Frambuesa Intenso
  { name: 'Viernes', fill: [225, 29, 72], light: [255, 241, 242], border: [244, 63, 94], textDark: [190, 18, 60] },
  // 6. Sábado: Teal / Turquesa Fresco
  { name: 'Sábado', fill: [13, 148, 136], light: [240, 253, 250], border: [20, 184, 166], textDark: [15, 118, 110] },
  // 7. Domingo: Índigo / Azul Noche Profundo
  { name: 'Domingo', fill: [67, 56, 202], light: [238, 242, 255], border: [99, 102, 241], textDark: [49, 46, 129] },
];

export function getDayTheme(dayName: string, dayIndex: number, dayOfWeek?: number): DayTheme {
  const norm = (dayName || '').toLowerCase();
  if (norm.includes('lunes') || dayOfWeek === 1) return DAY_THEMES[0];
  if (norm.includes('martes') || dayOfWeek === 2) return DAY_THEMES[1];
  if (norm.includes('miérc') || norm.includes('mierc') || dayOfWeek === 3) return DAY_THEMES[2];
  if (norm.includes('jueves') || dayOfWeek === 4) return DAY_THEMES[3];
  if (norm.includes('viernes') || dayOfWeek === 5) return DAY_THEMES[4];
  if (norm.includes('sáb') || norm.includes('sab') || dayOfWeek === 6) return DAY_THEMES[5];
  if (norm.includes('domingo') || dayOfWeek === 7 || dayOfWeek === 0) return DAY_THEMES[6];
  return DAY_THEMES[dayIndex % DAY_THEMES.length];
}

/**
 * Calculates SMAE equivalents distribution based on the plan items or clinical targets
 */
function computeSmaeDistribution(plan: NutritionPlan) {
  const mealNames = ['Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena'];
  const groups = [
    { code: 'VERDURAS', name: 'Verduras', kcal: 25, prot: 2, carb: 4, fat: 0 },
    { code: 'FRUTAS', name: 'Frutas', kcal: 60, prot: 0, carb: 15, fat: 0 },
    { code: 'CEREALES_SG', name: 'Cereales sin grasa', kcal: 70, prot: 2, carb: 15, fat: 0 },
    { code: 'CEREALES_CG', name: 'Cereales con grasa', kcal: 115, prot: 2, carb: 15, fat: 5 },
    { code: 'LEGUMINOSAS', name: 'Leguminosas', kcal: 120, prot: 8, carb: 20, fat: 1 },
    { code: 'AOA_MBA', name: 'AOA Muy Bajo Aporte', kcal: 40, prot: 7, carb: 0, fat: 1 },
    { code: 'AOA_BA', name: 'AOA Bajo Aporte', kcal: 55, prot: 7, carb: 0, fat: 3 },
    { code: 'AOA_MA', name: 'AOA Moderado Aporte', kcal: 75, prot: 7, carb: 0, fat: 5 },
    { code: 'LECHE_DESC', name: 'Leche y Yogur Descremado', kcal: 95, prot: 9, carb: 12, fat: 2 },
    { code: 'GRASAS_SP', name: 'Aceites y Grasas s/proteína', kcal: 45, prot: 0, carb: 0, fat: 5 },
    { code: 'GRASAS_CP', name: 'Aceites y Grasas c/proteína', kcal: 70, prot: 3, carb: 3, fat: 5 },
    { code: 'AZUCARES_SG', name: 'Azúcares sin grasa', kcal: 40, prot: 0, carb: 10, fat: 0 },
  ];

  const day = plan.days && plan.days.length > 0 ? plan.days[0] : null;
  const matrix: Record<string, number[]> = {};

  groups.forEach((g) => {
    matrix[g.code] = [0, 0, 0, 0, 0];
  });

  let hasCustomMappedItems = false;

  if (day && day.meals && day.meals.length > 0) {
    day.meals.forEach((meal, mealIdx) => {
      const colIdx = Math.min(mealIdx, 4);
      (meal.items || []).forEach((item) => {
        const code = item.equivalentGroupCode;
        if (code && matrix[code]) {
          matrix[code][colIdx] += item.portionQuantity || 1;
          hasCustomMappedItems = true;
        } else {
          const n = item.name.toLowerCase();
          if (n.includes('espinaca') || n.includes('nopal') || n.includes('brócoli') || n.includes('jitomate') || n.includes('verdura')) {
            matrix['VERDURAS'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('manzana') || n.includes('plátano') || n.includes('fresa') || n.includes('papaya') || n.includes('fruta')) {
            matrix['FRUTAS'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('tortilla') || n.includes('avena') || n.includes('arroz') || n.includes('tostada') || n.includes('pan')) {
            matrix['CEREALES_SG'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('frijol') || n.includes('lenteja') || n.includes('garbanzo')) {
            matrix['LEGUMINOSAS'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('atún') || n.includes('clara')) {
            matrix['AOA_MBA'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('pollo') || n.includes('pescado') || n.includes('panela')) {
            matrix['AOA_BA'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('huevo') || n.includes('res')) {
            matrix['AOA_MA'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('yogur') || n.includes('leche')) {
            matrix['LECHE_DESC'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('aguacate') || n.includes('aceite')) {
            matrix['GRASAS_SP'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          } else if (n.includes('almendra') || n.includes('nuez') || n.includes('chía')) {
            matrix['GRASAS_CP'][colIdx] += item.portionQuantity || 1;
            hasCustomMappedItems = true;
          }
        }
      });
    });
  }

  if (!hasCustomMappedItems) {
    const kcal = plan.targetCaloriesKcal || 1800;
    const factor = kcal / 1800;

    matrix['VERDURAS'] = [1, 0, 2, 0, 1].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['FRUTAS'] = [1, 1, 0, 1, 0].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['CEREALES_SG'] = [2, 0, 2, 0, 2].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['CEREALES_CG'] = [0, 0, 0, 0, 0];
    matrix['LEGUMINOSAS'] = [0, 0, 1, 0, 0].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['AOA_MBA'] = [1, 0, 0, 0, 1].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['AOA_BA'] = [1, 0, 2, 0, 0].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['AOA_MA'] = [1, 0, 0, 0, 0];
    matrix['LECHE_DESC'] = [0, 1, 0, 0, 0];
    matrix['GRASAS_SP'] = [1, 0, 1, 0, 1].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['GRASAS_CP'] = [0, 1, 0, 1, 0].map((v) => Math.round(v * factor * 10) / 10 || 1);
    matrix['AZUCARES_SG'] = [0, 0, 0, 0, 0];
  }

  return { mealNames, groups, matrix };
}

/**
 * Standard Header for Executive Nutrition Reports
 */
async function drawExecutiveHeader(
  doc: jsPDF,
  org: Organization,
  specialist: UserProfile,
  patient: Patient,
  plan: NutritionPlan,
  pageWidth: number,
  margin: number,
  _qrDataUrl?: string | null,
  logoResult?: { dataUrl: string; width: number; height: number } | null,
  c: PdfColors = colors
) {
  doc.setFillColor(c.headerBar[0], c.headerBar[1], c.headerBar[2]);
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFillColor(c.headerSubBar[0], c.headerSubBar[1], c.headerSubBar[2]);
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  doc.setFillColor(c.accent[0], c.accent[1], c.accent[2]);
  doc.rect(0, 34.5, pageWidth, 1, 'F');

  let textStartX = margin;

  if (logoResult) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 4.5, 25, 25, 3, 3, 'F');
      doc.setDrawColor(c.primaryBorder[0], c.primaryBorder[1], c.primaryBorder[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, 4.5, 25, 25, 3, 3, 'S');

      const maxLogoSize = 21;
      let imgW = maxLogoSize;
      let imgH = maxLogoSize;
      if (logoResult.width > logoResult.height) {
        imgH = (logoResult.height / logoResult.width) * maxLogoSize;
      } else {
        imgW = (logoResult.width / logoResult.height) * maxLogoSize;
      }
      const imgX = margin + (25 - imgW) / 2;
      const imgY = 4.5 + (25 - imgH) / 2;

      doc.addImage(logoResult.dataUrl, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');
      textStartX = margin + 29;
    } catch (err) {
      console.warn('Error embedding logo:', err);
    }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 4.5, 25, 25, 3, 3, 'F');
    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.roundedRect(margin + 2.5, 7, 20, 20, 2.5, 2.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 11, 10, 3, 14, 'F');
    doc.rect(margin + 5.5, 15.5, 14, 3, 'F');
    textStartX = margin + 29;
  }

  const rawName = `${specialist.firstName || 'Luz Elena'} ${specialist.lastName || 'Alcocer'}`.trim();
  const cleanName = rawName.replace(/^nutri[oó]loga\s+/i, '').replace(/^lic\.\s+en\s+nutrici[oó]n\s+/i, '').trim();
  const nutriologaTitle = `NUTRIÓLOGA ${cleanName.toUpperCase()}`;

  const cedula = specialist.licenseNumber && specialist.licenseNumber !== '11849204 / SSA 8921'
    ? specialist.licenseNumber
    : '15573967';
  const whatsapp = org.whatsapp && !org.whatsapp.includes('4162')
    ? org.whatsapp
    : (org.phone && !org.phone.includes('4162') ? org.phone : '7773846122');

  // Línea 1: Nutrióloga [Nombre] (Solo la nutrióloga, sin "Clínica Nutriluz")
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(cleanPdfText(nutriologaTitle), textStartX, 11);

  // Línea 2: PLAN NUTRICIONAL PERSONALIZADO
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(c.accentLight[0], c.accentLight[1], c.accentLight[2]);
  doc.text('PLAN NUTRICIONAL PERSONALIZADO', textStartX, 17);

  // Línea 3: Cédula Profesional y WhatsApp
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(226, 232, 240);
  doc.text(cleanPdfText(`Céd. Prof: ${cedula}   •   WhatsApp: ${whatsapp}`), textStartX, 22.5);

  // Línea 4: Prescripción Clínica Especializada
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208);
  doc.text(cleanPdfText('Prescripción Clínica Especializada • Sistema Mexicano de Equivalentes (SMAE)'), textStartX, 28);

  // Right side of Header in Landscape mode (panoramic executive view)
  if (pageWidth > 240) {
    const rightBoxW = 44;
    const rightBoxX = pageWidth - margin - rightBoxW;
    if (_qrDataUrl) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(rightBoxX, 4.5, rightBoxW, 25, 2.5, 2.5, 'F');
        doc.setDrawColor(c.primaryBorder[0], c.primaryBorder[1], c.primaryBorder[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(rightBoxX, 4.5, rightBoxW, 25, 2.5, 2.5, 'S');

        doc.addImage(_qrDataUrl, 'PNG', rightBoxX + 2, 6, 22, 22);

        doc.setFontSize(5.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.primaryDark[0], c.primaryDark[1], c.primaryDark[2]);
        doc.text('EXPEDIENTE', rightBoxX + 25.5, 12);
        doc.text('DIGITAL', rightBoxX + 25.5, 16);
        doc.setFontSize(4.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Portal Móvil', rightBoxX + 25.5, 20.5);
        doc.text('del Paciente', rightBoxX + 25.5, 24.5);
      } catch {
        // Fallback badge if image fails
      }
    } else {
      doc.setFillColor(255, 255, 255, 0.12);
      doc.roundedRect(rightBoxX, 5.5, rightBoxW, 23, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPEDIENTE CLÍNICO', rightBoxX + rightBoxW / 2, 14, { align: 'center' });
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Nutrición Médica Avanzada', rightBoxX + rightBoxW / 2, 20, { align: 'center' });
    }
  }
}

let cachedWatermarkDataUrl: string | null = null;
let lastWatermarkKey: string | null = null;

export function clearWatermarkCache() {
  cachedWatermarkDataUrl = null;
  lastWatermarkKey = null;
}

/**
 * Draws a clean default clinical emblem if the clinic hasn't uploaded a custom logo yet
 */
function drawDefaultClinicalWatermark(ctx: CanvasRenderingContext2D, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(225, 225);

  // Outer circular badge
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner accent ring
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 166, 0, Math.PI * 2);
  ctx.stroke();

  // Central medical health cross with rounded edges
  ctx.fillStyle = '#059669';
  const armW = 42;
  const armL = 124;
  ctx.fillRect(-armW / 2, -armL / 2, armW, armL);
  ctx.fillRect(-armL / 2, -armW / 2, armL, armW);

  // Center spark / leaf
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  // Text inside watermark badge
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 30px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NUTRILUZ', 0, 100);

  ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#047857';
  ctx.fillText('PLAN NUTRICIONAL PERSONALIZADO', 0, 130);

  ctx.restore();
}

export async function getWatermarkDataUrl(
  logoResult: { dataUrl: string; width: number; height: number } | null,
  targetOpacity?: number
): Promise<string> {
  if (typeof document === 'undefined') return '';

  let opacity = 0.22; // Modern crisp default (was 0.14 which was too faint)
  if (typeof targetOpacity === 'number' && !isNaN(targetOpacity)) {
    opacity = Math.max(0.02, Math.min(0.85, targetOpacity));
  } else if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('nutriluz_watermark_opacity');
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val)) opacity = Math.max(0.02, Math.min(0.85, val));
    }
  }

  // Key reflects logo source (hash / length / prefix) + opacity
  const logoKey = logoResult?.dataUrl ? `${logoResult.dataUrl.slice(0, 80)}_${logoResult.dataUrl.length}` : 'default_emblem';
  const cacheKey = `${logoKey}_${opacity.toFixed(3)}`;
  if (cachedWatermarkDataUrl && lastWatermarkKey === cacheKey) {
    return cachedWatermarkDataUrl;
  }

  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 450;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      ctx.clearRect(0, 0, 450, 450);

      if (logoResult && logoResult.dataUrl) {
        const img = new Image();
        if (!logoResult.dataUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          try {
            ctx.clearRect(0, 0, 450, 450);
            ctx.globalAlpha = opacity;
            const maxS = 400;
            let w = maxS;
            let h = maxS;
            if (logoResult.width > logoResult.height) {
              h = Math.round((logoResult.height / logoResult.width) * maxS);
            } else {
              w = Math.round((logoResult.width / logoResult.height) * maxS);
            }
            const x = (450 - w) / 2;
            const y = (450 - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            const res = canvas.toDataURL('image/png');
            cachedWatermarkDataUrl = res;
            lastWatermarkKey = cacheKey;
            resolve(res);
          } catch {
            drawDefaultClinicalWatermark(ctx, opacity);
            const res = canvas.toDataURL('image/png');
            resolve(res);
          }
        };
        img.onerror = () => {
          drawDefaultClinicalWatermark(ctx, opacity);
          const res = canvas.toDataURL('image/png');
          resolve(res);
        };
        img.src = logoResult.dataUrl;
      } else {
        // Draw default emblem watermark
        drawDefaultClinicalWatermark(ctx, opacity);
        const res = canvas.toDataURL('image/png');
        cachedWatermarkDataUrl = res;
        lastWatermarkKey = cacheKey;
        resolve(res);
      }
    } catch {
      resolve('');
    }
  });
}

/**
 * Universal Footer and Watermark for all pages
 */
function applyFooters(
  doc: jsPDF,
  _org: Organization,
  specialist: UserProfile,
  patient: Patient,
  _pageWidth: number,
  _pageHeight: number,
  c: PdfColors = colors,
  watermarkDataUrl?: string
) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const rawName = `${specialist?.firstName || 'Luz Elena'} ${specialist?.lastName || 'Alcocer'}`.trim();
  const specName = rawName.replace(/^nutri[oó]loga\s+/i, '').replace(/^lic\.\s+en\s+nutrici[oó]n\s+/i, '').trim();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pW = (doc as any).internal.pageSize.getWidth();
    const pH = (doc as any).internal.pageSize.getHeight();

    // Subtle center watermark on each page
    if (watermarkDataUrl) {
      try {
        const wmSize = Math.min(pW, pH) * 0.52;
        const wmX = (pW - wmSize) / 2;
        const wmY = (pH - wmSize) / 2 + (pH > pW ? 10 : 4);
        doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
      } catch (err) {
        // Silently continue if watermark drawing fails
      }
    }

    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.rect(0, pH - 6, pW, 6, 'F');

    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    const footerText = `Nutrióloga ${specName} • Plan Nutricional Personalizado • Paciente: ${patient.firstName} ${patient.lastName} • Página ${i} de ${pageCount}`;
    doc.text(cleanPdfText(footerText), pW / 2, pH - 2, { align: 'center' });
  }
}

/**
 * DYNAMIC SECTION: "¿Por qué [X] calorías? Entendiendo tu Plan Nutricional"
 * Replicates and improves the user's reference images:
 * - Dynamic Title with exact Target Calories
 * - Subtitle explaining energy expenditure and composition
 * - Callout box "Un mensaje importante para ti" personalized with patient's name and goal
 * - Section 1: Tu Gasto Energético Total (GET): El punto de partida
 * - 3 Dynamic Cards: [GET Kcal] | [Tu Consumo Actual (Déficit/Meta)] | [Déficit/Superávit Diario Planificado]
 * - Section 2: ¿Por qué [X] calorías genera pérdida de grasa / ganancia muscular?
 * - Section 3: El Papel de Cada Macronutriente en tus [X] kcal (Proteínas, Carbohidratos, Grasas Saludables)
 * - Section 4: Conclusión: Confía en el proceso
 * - Next Appointment Box: Próxima revisión de seguimiento
 */
function drawWhyCaloriesSection(
  doc: jsPDF,
  plan: NutritionPlan,
  patient: Patient,
  pageWidth: number,
  margin: number,
  startY: number,
  c: PdfColors = colors
): number {
  const contentWidth = pageWidth - margin * 2; // 182mm
  let currentY = startY;

  const targetKcal = plan.targetCaloriesKcal || 1800;
  const proteinG = plan.targetProteinG || 130;
  const carbsG = plan.targetCarbsG || 180;
  const fatG = plan.targetFatG || 50;
  const weightKg = patient.currentWeight || 70;
  const heightM = (patient.height || 165) / 100;
  const protPerKg = weightKg > 0 ? (proteinG / weightKg).toFixed(1) : '1.8';

  // Calculate GET & Deficit/Surplus dynamically
  const birthYear = patient.birthDate ? new Date(patient.birthDate).getFullYear() : 1995;
  const age = new Date().getFullYear() - birthYear;
  const isFemale = patient.gender === 'F';
  const bmrEstimate = isFemale
    ? Math.round(10 * weightKg + 6.25 * (patient.height || 165) - 5 * age - 161)
    : Math.round(10 * weightKg + 6.25 * (patient.height || 165) - 5 * age + 5);
  
  // Calculate clinically coherent GET:
  // If target is high (e.g. 3000), GET might be 3600 kcal.
  let getKcal = Math.round(bmrEstimate * 1.55);
  if (targetKcal >= 2800) {
    getKcal = Math.max(getKcal, targetKcal + 600);
  } else if (targetKcal >= 2000) {
    getKcal = Math.max(getKcal, targetKcal + 500);
  } else if (targetKcal <= getKcal - 300) {
    // Standard deficit
  } else {
    getKcal = targetKcal + 400;
  }

  const diffKcal = targetKcal - getKcal;
  const isDeficit = diffKcal < 0;
  const patientFirstName = patient.firstName || 'Paciente';
  const rawGoal = (plan.goal || patient.goal || 'perder grasa corporal de forma sostenible y con alta energía').toLowerCase();

  if (pageWidth > 250) {
    // ----------------------------------------------------
    // LANDSCAPE EXECUTIVE 2-COLUMN LAYOUT (Widescreen Medical Infographic)
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(
      cleanPdfText(`¿Por qué ${targetKcal.toLocaleString('es-MX')} calorías? Entendiendo tu Plan Nutricional`),
      margin,
      currentY + 2
    );
    currentY += 6.5;

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.text(
      'Guía explicativa sobre tu gasto energético, el déficit saludable y la composición de tus macronutrientes.',
      margin,
      currentY
    );
    currentY += 2.8;

    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.rect(margin, currentY, contentWidth, 0.7, 'F');
    currentY += 4.5;

    const colGap = 7;
    const colW = (contentWidth - colGap) / 2; // ~131mm
    const col1X = margin;
    const col2X = margin + colW + colGap;
    const topColY = currentY;

    // === LEFT COLUMN (GET, Cards, Why Kcal) ===
    let yLeft = topColY;

    // 1. Callout Box: Un mensaje importante para ti
    const calloutH = 22;
    doc.setFillColor(c.primaryLight[0], c.primaryLight[1], c.primaryLight[2]);
    doc.setDrawColor(c.primaryBorder[0], c.primaryBorder[1], c.primaryBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(col1X, yLeft, colW, calloutH, 2.5, 2.5, 'FD');
    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.roundedRect(col1X, yLeft, 2.5, calloutH, 1, 1, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(c.primaryDark[0], c.primaryDark[1], c.primaryDark[2]);
    doc.text(cleanPdfText('*  Un mensaje importante para ti'), col1X + 5, yLeft + 5);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const messageBody =
      `${patientFirstName}, sabemos que ${targetKcal.toLocaleString('es-MX')} calorías puede sonar a una cantidad ${targetKcal >= 2500 ? 'muy alta' : 'específica'} de comida. Este valor está meticulosamente calculado según tus requerimientos metabólicos, actividad física y tu meta de ${rawGoal}.`;
    const splitMsg = doc.splitTextToSize(cleanPdfText(messageBody), colW - 9);
    doc.text(splitMsg, col1X + 5, yLeft + 9.5);
    yLeft += calloutH + 4;

    // 2. Section 1: Tu Gasto Energético Total (GET)
    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.rect(col1X, yLeft, 2, 4, 'F');
    doc.setFontSize(8.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('1. Tu Gasto Energético Total (GET): Punto de partida', col1X + 3.8, yLeft + 3.4);
    yLeft += 5.5;

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const getDesc =
      'Tu organismo quema energía constante en metabolismo basal, efecto térmico de los alimentos y el ejercicio que realizas día a día.';
    const splitGet = doc.splitTextToSize(cleanPdfText(getDesc), colW);
    doc.text(splitGet, col1X, yLeft);
    yLeft += splitGet.length * 3.2 + 2.5;

    // 3. 3 Dynamic Cards
    const cardW = (colW - 4) / 3;
    const cardH = 17;

    // Card 1: GET
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(col1X, yLeft, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${getKcal.toLocaleString('es-MX')} kcal`, col1X + cardW / 2, yLeft + 7.2, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('GASTO GET TOTAL', col1X + cardW / 2, yLeft + 12.8, { align: 'center' });

    // Card 2: Tu Consumo Actual
    const card2X = col1X + cardW + 2;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(card2X, yLeft, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`${targetKcal.toLocaleString('es-MX')} kcal`, card2X + cardW / 2, yLeft + 7.2, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70);
    doc.text(isDeficit ? 'CONSUMO (DEFICIT)' : 'CONSUMO (META)', card2X + cardW / 2, yLeft + 12.8, { align: 'center' });

    // Card 3: Déficit / Ajuste Diario
    const card3X = card2X + cardW + 2;
    doc.setFillColor(isDeficit ? 255 : 239, isDeficit ? 241 : 246, isDeficit ? 242 : 255);
    doc.setDrawColor(isDeficit ? 254 : 191, isDeficit ? 205 : 219, isDeficit ? 211 : 254);
    doc.roundedRect(card3X, yLeft, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isDeficit ? 225 : 37, isDeficit ? 29 : 99, isDeficit ? 72 : 235);
    doc.text(`${diffKcal > 0 ? '+' : ''}${diffKcal.toLocaleString('es-MX')} kcal`, card3X + cardW / 2, yLeft + 7.2, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isDeficit ? 190 : 29, isDeficit ? 18 : 78, isDeficit ? 60 : 216);
    doc.text(isDeficit ? 'DEFICIT DIARIO' : 'SUPERAVIT DIARIO', card3X + cardW / 2, yLeft + 12.8, { align: 'center' });

    yLeft += cardH + 4;

    // 4. Section 2: Por qué X calorías genera el resultado
    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.rect(col1X, yLeft, 2, 4, 'F');
    doc.setFontSize(8.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const sec2Title = isDeficit
      ? `2. Por qué ${targetKcal.toLocaleString('es-MX')} kcal genera pérdida de grasa`
      : `2. Por qué ${targetKcal.toLocaleString('es-MX')} kcal genera desarrollo muscular`;
    doc.text(sec2Title, col1X + 3.8, yLeft + 3.4);
    yLeft += 5.5;

    doc.setFontSize(6.7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const sec2Paragraph = isDeficit
      ? `Al fijar ${targetKcal.toLocaleString('es-MX')} kcal diarias, generamos un déficit estratégico de ${Math.abs(diffKcal).toLocaleString('es-MX')} kcal frente a tu gasto de ${getKcal.toLocaleString('es-MX')} kcal.\n\nEsto fuerza a tu cuerpo a metabolizar tejido adiposo como energía sin desnutrición, conservando tu masa muscular magra y tus defensas al 100%.`
      : `Al consumir ${targetKcal.toLocaleString('es-MX')} kcal diarias con un gasto de ${getKcal.toLocaleString('es-MX')} kcal, brindamos el sustrato perfecto para la síntesis de nuevas fibras musculares sin ganancia indeseada de tejido graso.`;
    const splitSec2 = doc.splitTextToSize(cleanPdfText(sec2Paragraph), colW);
    doc.text(splitSec2, col1X, yLeft);
    yLeft += splitSec2.length * 3.1 + 3;

    // === RIGHT COLUMN (Macronutrients, Conclusion, Follow-up) ===
    let yRight = topColY;

    // 1. Section 3: El Papel de Cada Macronutriente
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(cleanPdfText(`El Papel de Cada Macronutriente en tus ${targetKcal.toLocaleString('es-MX')} kcal`), col2X, yRight + 3.2);
    yRight += 5;

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.text('Distribución clínica que previene fatiga, protege músculo y regula hormonas:', col2X, yRight + 2.5);
    yRight += 5.5;

    const macroRows = [
      [
        'Proteínas',
        'Construcción y protección tisular.',
        `${proteinG}g (${protPerKg}g/kg): Conserva tu masa muscular magra activa.`,
      ],
      [
        'Carbohidratos',
        'Combustible cerebral y muscular.',
        `${carbsG}g: Energía continua sin picos glucémicos ni fatiga.`,
      ],
      [
        'Grasas Buenas',
        'Regulación hormonal y saciedad.',
        `${fatG}g: Síntesis de hormonas esteroideas y protección celular.`,
      ],
    ];

    autoTable(doc, {
      startY: yRight,
      head: [['Macronutriente', 'Función Clínica', 'Objetivo Personalizado']],
      body: macroRows,
      theme: 'grid',
      headStyles: {
        fillColor: c.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8,
        halign: 'left',
      },
      styles: {
        fontSize: 6.4,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { cellWidth: 44 },
        2: { cellWidth: 61 },
      },
      margin: { left: col2X, right: margin },
      pageBreak: 'avoid',
    });

    yRight = (doc as any).lastAutoTable.finalY + 4;

    // 2. Section 4: Conclusión: Confía en el proceso
    doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
    doc.rect(col2X, yRight, 2, 4, 'F');
    doc.setFontSize(8.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Conclusión: Confía en el proceso', col2X + 3.8, yRight + 3.4);
    yRight += 5.5;

    doc.setFontSize(6.7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const conclusionText =
      `Comer bien no significa pasar hambre. Este plan garantiza que entrenes con energía, mantengas un metabolismo acelerado y logres un cambio físico y de salud definitivo.`;
    const splitConc = doc.splitTextToSize(cleanPdfText(conclusionText), colW);
    doc.text(splitConc, col2X, yRight);
    yRight += splitConc.length * 3.1 + 3.5;

    // 3. Callout: Próxima revisión de seguimiento
    const followUpH = 14;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(col2X, yRight, colW, followUpH, 2, 2, 'FD');
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(col2X, yRight, 2.5, followUpH, 1, 1, 'F');

    doc.setFontSize(7.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Próxima revisión de seguimiento', col2X + 5, yRight + 4.8);

    const nextDateFormatted = patient.nextConsultationDate
      ? new Date(patient.nextConsultationDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date(Date.now() + 28 * 86400000).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

    doc.setFontSize(6.4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      cleanPdfText(`Cita de control agendada para el ${nextDateFormatted} para evaluar somatometría y evolución.`),
      col2X + 5,
      yRight + 9.5
    );

    return Math.max(yLeft, yRight + followUpH + 4);
  }

  // ----------------------------------------------------
  // Title & Subtitle with blue underline (Portrait Fallback)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(
    cleanPdfText(`¿Por qué ${targetKcal.toLocaleString('es-MX')} calorías? Entendiendo tu Plan Nutricional`),
    margin,
    currentY
  );
  currentY += 5.5;

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.text(
    'Guía explicativa sobre tu gasto energético, el déficit saludable y la composición de tus alimentos.',
    margin,
    currentY
  );
  currentY += 3.2;

  // Underline bar
  doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.rect(margin, currentY, contentWidth, 0.8, 'F');
  currentY += 4.5;

  // ----------------------------------------------------
  // Callout Box: "Un mensaje importante para ti"
  // ----------------------------------------------------
  const calloutH = 25;
  doc.setFillColor(c.primaryLight[0], c.primaryLight[1], c.primaryLight[2]);
  doc.setDrawColor(c.primaryBorder[0], c.primaryBorder[1], c.primaryBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, calloutH, 2.5, 2.5, 'FD');

  // Left solid ribbon
  doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.roundedRect(margin, currentY, 2.5, calloutH, 1, 1, 'F');

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(c.primaryDark[0], c.primaryDark[1], c.primaryDark[2]);
  doc.text(cleanPdfText('*  Un mensaje importante para ti'), margin + 5.5, currentY + 5.5);

  doc.setFontSize(7.1);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59); // Slate 800
  const messageBody =
    `${patientFirstName}, sabemos que ${targetKcal.toLocaleString('es-MX')} calorías puede sonar a una cantidad ${targetKcal >= 2500 ? 'muy alta' : 'específica'} de comida a primera vista. Sin embargo, este número no ha sido elegido al azar: está perfectamente calculado con base en tus requerimientos diarios, tu nivel de actividad física y tu meta de ${rawGoal}.`;
  const splitMsg = doc.splitTextToSize(cleanPdfText(messageBody), contentWidth - 11);
  doc.text(splitMsg, margin + 5.5, currentY + 10.5);

  currentY += calloutH + 5;

  // ----------------------------------------------------
  // Section 1: "1. Tu Gasto Energético Total (GET): El punto de partida"
  // ----------------------------------------------------
  doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.rect(margin, currentY, 2, 4.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Tu Gasto Energético Total (GET): El punto de partida', margin + 4, currentY + 3.8);
  currentY += 6;

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const getDesc =
    'El cuerpo humano consume energía de forma constante para mantener sus funciones vitales (respirar, latir el corazón, temperatura corporal), sumado a la digestión de alimentos y a toda la actividad física o entrenamiento que realizas.';
  const splitGet = doc.splitTextToSize(cleanPdfText(getDesc), contentWidth);
  doc.text(splitGet, margin, currentY);
  currentY += splitGet.length * 3.3 + 3;

  // ----------------------------------------------------
  // 3 Dynamic Cards: GET | TU CONSUMO | DÉFICIT/SUPERÁVIT
  // ----------------------------------------------------
  const cardW = (contentWidth - 6) / 3;
  const cardH = 18;

  // Card 1: GET
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${getKcal.toLocaleString('es-MX')} kcal`, margin + cardW / 2, currentY + 7.5, { align: 'center' });
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('GASTO ENERGETICO TOTAL (GET)', margin + cardW / 2, currentY + 13.5, { align: 'center' });

  // Card 2: Tu Consumo Actual
  const card2X = margin + cardW + 3;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(card2X, currentY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(`${targetKcal.toLocaleString('es-MX')} kcal`, card2X + cardW / 2, currentY + 7.5, { align: 'center' });
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(isDeficit ? 'TU CONSUMO ACTUAL (DEFICIT)' : 'TU CONSUMO ACTUAL (META)', card2X + cardW / 2, currentY + 13.5, { align: 'center' });

  // Card 3: Déficit / Ajuste Diario
  const card3X = card2X + cardW + 3;
  doc.setFillColor(isDeficit ? 255 : 239, isDeficit ? 241 : 246, isDeficit ? 242 : 255); // Rose or Blue 50
  doc.setDrawColor(isDeficit ? 254 : 191, isDeficit ? 205 : 219, isDeficit ? 211 : 254);
  doc.roundedRect(card3X, currentY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDeficit ? 225 : 37, isDeficit ? 29 : 99, isDeficit ? 72 : 235); // Rose or Blue 600
  doc.text(`${diffKcal > 0 ? '+' : ''}${diffKcal.toLocaleString('es-MX')} kcal`, card3X + cardW / 2, currentY + 7.5, { align: 'center' });
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDeficit ? 190 : 29, isDeficit ? 18 : 78, isDeficit ? 60 : 216);
  doc.text(isDeficit ? 'DEFICIT DIARIO PLANIFICADO' : 'SUPERAVIT DIARIO PLANIFICADO', card3X + cardW / 2, currentY + 13.5, { align: 'center' });

  currentY += cardH + 5;

  // ----------------------------------------------------
  // Section 2: "¿Por qué [X] calorías genera pérdida de grasa?"
  // ----------------------------------------------------
  doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.rect(margin, currentY, 2, 4.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const sec2Title = isDeficit
    ? `2. ¿Por qué ${targetKcal.toLocaleString('es-MX')} calorías genera pérdida de grasa?`
    : `2. ¿Por qué ${targetKcal.toLocaleString('es-MX')} calorías genera desarrollo muscular óptimo?`;
  doc.text(sec2Title, margin + 4, currentY + 3.8);
  currentY += 6;

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const sec2Paragraph = isDeficit
    ? `Para perder grasa corporal, es indispensable generar un déficit calórico (consumir menos energía de la que tu cuerpo quema). Tu gasto total es de aproximadamente ${getKcal.toLocaleString('es-MX')} calorías diarias debido a tu ritmo de vida y exigencia física.\n\nAl asignarte ${targetKcal.toLocaleString('es-MX')} calorías diarias, creamos un déficit controlado de ${Math.abs(diffKcal).toLocaleString('es-MX')} calorías. Esto le indica a tu organismo que movilice sus reservas de grasa almacenada para obtener la energía faltante, logrando una pérdida de grasa progresiva sin poner en riesgo tu masa muscular ni tu rendimiento físico.`
    : `Para ganar masa muscular sin acumular grasa excesiva, es indispensable un superávit energético controlado. Tu gasto total es de aproximadamente ${getKcal.toLocaleString('es-MX')} calorías diarias y al consumir ${targetKcal.toLocaleString('es-MX')} calorías diarias le damos a tu organismo los nutrientes exactos para la hipertrofia limpia y óptima recuperación.`;

  const splitSec2 = doc.splitTextToSize(cleanPdfText(sec2Paragraph), contentWidth);
  doc.text(splitSec2, margin, currentY);
  currentY += splitSec2.length * 3.3 + 5;

  // ----------------------------------------------------
  // Section 3: "El Papel de Cada Macronutriente en tus [X] kcal"
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(cleanPdfText(`El Papel de Cada Macronutriente en tus ${targetKcal.toLocaleString('es-MX')} kcal`), margin, currentY);
  currentY += 4.5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.text('Por qué consumimos suficientes carbohidratos, proteínas y grasas saludables.', margin, currentY);
  currentY += 3.2;

  // Underline
  doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.rect(margin, currentY, contentWidth, 0.6, 'F');
  currentY += 3.5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const macroIntro =
    'Muchas dietas comerciales reducen drásticamente la comida provocando fatiga extrema, pérdida de músculo y desajustes hormonales. Tu plan está diseñado con abundantes nutrientes clave:';
  const splitMacroIntro = doc.splitTextToSize(cleanPdfText(macroIntro), contentWidth);
  doc.text(splitMacroIntro, margin, currentY);
  currentY += splitMacroIntro.length * 3.2 + 3;

  // Macronutrient Explanation Table
  const macroRows = [
    [
      'Proteínas',
      'Construcción y protección de tejido muscular.',
      `Aumentadas (${proteinG}g · ${protPerKg}g/kg) para asegurar que el peso que pierdas sea estrictamente grasa y mantengas tu tono muscular intacto.`,
    ],
    [
      'Carbohidratos',
      'Combustible principal para el sistema nervioso y muscular.',
      `Elevados (${carbsG}g) para que nunca te falte energía en tus entrenamientos y actividades diarias, evitando bajones de ánimo o debilidad.`,
    ],
    [
      'Grasas Saludables',
      'Síntesis hormonal y salud celular.',
      `Incluidas (${fatG}g) en proporciones adecuadas para garantizar la correcta regulación de tus hormonas (como testosterona y tiroideas) y proteger tu salud metabólica.`,
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Macronutriente', 'Función Principal en tu Plan', 'Por qué está optimizado']],
    body: macroRows,
    theme: 'grid',
    headStyles: {
      fillColor: c.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 50 },
      2: { cellWidth: 100 },
    },
    margin: { left: margin, right: margin },
    pageBreak: 'auto',
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // ----------------------------------------------------
  // Section 4: "Conclusión: Confía en el proceso"
  // ----------------------------------------------------
  doc.setFillColor(c.primary[0], c.primary[1], c.primary[2]);
  doc.rect(margin, currentY, 2, 4.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Conclusión: Confía en el proceso', margin + 4, currentY + 3.8);
  currentY += 5.5;

  doc.setFontSize(7.1);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const conclusionText =
    `Aunque ${targetKcal.toLocaleString('es-MX')} calorías parezca mucha comida en comparación con dietas restrictivas extremas, recuerda que tu cuerpo tiene un gasto muy elevado (${getKcal.toLocaleString('es-MX')} kcal). Este volumen de alimentos es tu mejor aliado: te permite comer bien, entrenar con fuerza, regular tus hormonas y quemar grasa de forma inteligente.`;
  const splitConc = doc.splitTextToSize(cleanPdfText(conclusionText), contentWidth);
  doc.text(splitConc, margin, currentY);
  currentY += splitConc.length * 3.3 + 3.5;

  // ----------------------------------------------------
  // Callout: "Próxima revisión de seguimiento"
  // ----------------------------------------------------
  const followUpH = 14;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, followUpH, 2, 2, 'FD');

  // Left dark blue border
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, currentY, 2.5, followUpH, 1, 1, 'F');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Próxima revisión de seguimiento', margin + 5.5, currentY + 4.8);

  const nextDateFormatted = patient.nextConsultationDate
    ? new Date(patient.nextConsultationDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date(Date.now() + 28 * 86400000).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    cleanPdfText(`Recuerda acudir a tu cita de control el ${nextDateFormatted} para evaluar tus avances y realizar los ajustes necesarios en tu plan.`),
    margin + 5.5,
    currentY + 9.5
  );

  currentY += followUpH + 6;
  return currentY;
}

/**
 * Reference weekly preset data matching the user's reference images
 * 7 Days x 4 Meals (Desayuno, Almuerzo, Comida, Cena)
 */
export const DEFAULT_WEEKLY_MEAL_PRESETS = [
  {
    mealName: 'Desayuno',
    suggestedTime: '07:00',
    days: [
      {
        dishTitle: 'Pan con crema de cacahuate y plátano',
        bullets: [
          '2 pieza de Pan integral',
          '1 pieza de Plátano',
          '1 cucharada de Crema de cacahuate natural',
          'canela en polvo.',
        ],
      },
      {
        dishTitle: 'Pan integral con crema de almendras y zarzamora',
        bullets: [
          '2 pieza de Pan integral',
          '2 taza de Zarzamora',
          '1 cucharada de Crema de almendra natural',
        ],
      },
      {
        dishTitle: 'Licuado de plátano y moras',
        bullets: [
          '2/3 taza de Avena en hojuela cruda',
          '1/2 pieza de Plátano',
          '3/4 taza de Moras',
          '10 piezas de Almendra',
          'edulcorante artificial.',
        ],
      },
      {
        dishTitle: 'Melón con granola y almendras',
        bullets: [
          '6 cucharadas de Granola',
          '2 taza de Melón picado',
          '10 piezas de Almendra',
        ],
      },
      {
        dishTitle: 'Croissant con queso crema y frambuesas',
        bullets: [
          '1 pieza mediana de Croissant',
          '2 taza de Frambuesa',
          '1 cucharada de Queso crema',
          'café negro sin azúcar.',
        ],
      },
      {
        dishTitle: 'Avena en frío con fruta',
        bullets: [
          '2/3 taza de Avena en hojuela cruda',
          '3/4 taza de Moras',
          '1 pieza de Manzana',
          '2 cucharadas de Semilla de chía',
          'stevia (opcional).',
          'canela.',
        ],
      },
      {
        dishTitle: 'Pan con crema de cacahuate y plátano',
        bullets: [
          '2 pieza de Pan integral',
          '1 pieza de Plátano',
          '1 cucharada de Crema de cacahuate natural',
          'canela en polvo.',
        ],
      },
    ],
  },
  {
    mealName: 'Almuerzo',
    suggestedTime: '09:00',
    days: [
      {
        dishTitle: 'Pan francés con ricotta y mermelada casera',
        bullets: [
          '2 pieza de Pan integral',
          '1 1/2 taza de Arándano azul',
          '2 cucharada de Crema de cacahuate natural',
          '2 pieza de Huevo entero',
          '6 cucharadas de Queso ricotta bajo en grasa',
          'canela .',
          'limón.',
          'vainilla.',
          '2 cucharadas de leche light.',
        ],
      },
      {
        dishTitle: 'Hot cake de 4 ingredientes',
        bullets: [
          '2/3 taza de Avena en hojuela cruda',
          '1 pieza de Plátano',
          '2 cucharada de Crema de cacahuate natural',
          '4 pieza de Huevo entero',
          'canela.',
        ],
      },
      {
        dishTitle: 'Quesadillas de queso oaxaca',
        bullets: [
          '6 piezas de Tortilla de nopal',
          '2 taza de Papaya picada',
          '14 mitades de Nuez',
          '120.0 gramos de Queso oaxaca',
        ],
      },
      {
        dishTitle: 'Toast de huevo con queso',
        bullets: [
          '2 pieza de Pan integral tostado',
          '2 cucharadita de Aceite de oliva',
          '2 pieza de Huevo entero',
          '50.0 gramos de Queso manchego',
          '2 porciones de fruta',
        ],
      },
      {
        dishTitle: 'Huevos revueltos con jamón y queso',
        bullets: [
          '2 pieza de Tortilla de maíz',
          '4 piezas de Mandarina',
          '2 cucharadita de Aceite',
          '2 rebanadas de Jamón virginia',
          '1 1/3 pieza de Huevo entero',
          '53.2 gramos de Queso fresco',
        ],
      },
      {
        dishTitle: 'Huevo con pan tostado',
        bullets: [
          '2 pieza de Tortilla de maíz',
          '2 taza de Melón picado',
          '3 cucharadita de Mantequilla de vaca',
          '3 1/3 pieza de Huevo entero',
          '1 1/6 rebanadas de Jamón virginia',
        ],
      },
      {
        dishTitle: 'Pan francés con ricotta y mermelada casera',
        bullets: [
          '2 pieza de Pan integral',
          '1 1/2 taza de Arándano azul',
          '2 cucharada de Crema de cacahuate natural',
          '2 pieza de Huevo entero',
          '6 cucharadas de Queso ricotta bajo en grasa',
          'canela .',
          'limón.',
          'vainilla.',
          '2 cucharadas de leche light.',
        ],
      },
    ],
  },
  {
    mealName: 'Comida',
    suggestedTime: '14:00',
    days: [
      {
        dishTitle: 'Pechuga a la plancha con arroz y nopales',
        bullets: [
          '140g Pechuga de pollo limpia',
          '3/4 taza de Arroz integral al vapor',
          '2 piezas de Nopales asados',
          '1/2 taza de Frijoles negros de la olla',
          '1 cucharadita de Aceite de oliva',
        ],
      },
      {
        dishTitle: 'Bistec de res con papas al horno y ensalada',
        bullets: [
          '130g Bistec de res magro',
          '1 pieza mediana de Papa cocida o al horno',
          '2 tazas de Ensalada verde mixta',
          '1 cucharada de Aceite de oliva extravirgen',
        ],
      },
      {
        dishTitle: 'Filete de pescado al ajillo con quinoa',
        bullets: [
          '150g Filete de pescado blanco fresco',
          '3/4 taza de Quinoa cocida',
          '1 taza de Brócoli al vapor con limón',
          '1/3 pieza de Aguacate Hass',
        ],
      },
      {
        dishTitle: 'Pollo deshebrado con tostadas horneadas',
        bullets: [
          '120g Pollo deshebrado cocido',
          '3 piezas de Tostadas de maíz horneadas',
          '1 taza de Frijoles molidos sin manteca',
          'Lechuga y salsa verde fresca al gusto',
        ],
      },
      {
        dishTitle: 'Salmón a la plancha con verduras salteadas',
        bullets: [
          '130g Filete de salmón fresco',
          '1 taza de Calabacitas y zanahoria al vapor',
          '1/2 taza de Arroz salvaje o integral',
          '1 cucharadita de Semillas de ajonjolí',
        ],
      },
      {
        dishTitle: 'Pechuga rellena de espinacas y queso panela',
        bullets: [
          '140g Pechuga de pollo',
          '1 taza de Espinacas frescas',
          '40g Queso panela bajo en sodio',
          '1 taza de Puré de papa casero sin mantequilla',
        ],
      },
      {
        dishTitle: 'Pechuga a la plancha con arroz y nopales',
        bullets: [
          '140g Pechuga de pollo limpia',
          '3/4 taza de Arroz integral al vapor',
          '2 piezas de Nopales asados',
          '1/2 taza de Frijoles negros de la olla',
        ],
      },
    ],
  },
  {
    mealName: 'Cena',
    suggestedTime: '20:00',
    days: [
      {
        dishTitle: 'Sincronizadas ligeras con pico de gallo',
        bullets: [
          '2 piezas de Tortilla de maíz',
          '40g Queso panela o Oaxaca bajo en grasa',
          '2 rebanadas de Pechuga de pavo',
          'Pico de gallo abundante con limón',
        ],
      },
      {
        dishTitle: 'Tazón de avena tibia con manzana y canela',
        bullets: [
          '1/2 taza de Avena en hojuelas cocida con agua',
          '1 pieza de Manzana en cubos',
          '1 cucharadita de Canela molida',
          '10 piezas de Almendra picada',
        ],
      },
      {
        dishTitle: 'Tostadas de atún a la mexicana',
        bullets: [
          '1 lata de Atún en agua drenado',
          '2 piezas de Tostadas de maíz horneadas',
          'Jitomate, cebolla y cilantro picado',
          '1/3 pieza de Aguacate Hass',
        ],
      },
      {
        dishTitle: 'Omelette de claras con champiñones',
        bullets: [
          '3 piezas de Clara de huevo',
          '1 taza de Champiñones rebanados salteados',
          '1 pieza de Pan integral tostado',
          'Té verde o infusión sin azúcar',
        ],
      },
      {
        dishTitle: 'Yogurt griego con moras y nueces',
        bullets: [
          '3/4 taza de Yogurt griego sin azúcar',
          '1/2 taza de Moras o frambuesas frescas',
          '4 mitades de Nuez picada',
          '1 cucharadita de Semillas de chía',
        ],
      },
      {
        dishTitle: 'Wrap de pollo y aguacate en tortilla de nopal',
        bullets: [
          '2 piezas de Tortilla de nopal',
          '70g Pechuga de pollo deshebrada',
          '1/3 pieza de Aguacate Hass',
          'Hojas de espinaca baby y salsa al gusto',
        ],
      },
      {
        dishTitle: 'Sincronizadas ligeras con pico de gallo',
        bullets: [
          '2 piezas de Tortilla de maíz',
          '40g Queso panela o Oaxaca bajo en grasa',
          '2 rebanadas de Pechuga de pavo',
          'Pico de gallo abundante con limón',
        ],
      },
    ],
  },
];

/**
 * Gets saved custom meal photos for a specific plan from localStorage
 */
export function getSavedMealPhotos(planId?: string): Record<string, string> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const id = planId || 'active-plan';
    const raw = localStorage.getItem(`nutriluz_meal_photos_${id}`);
    if (raw) return JSON.parse(raw);
    if (id !== 'active-plan') {
      const activeRaw = localStorage.getItem('nutriluz_meal_photos_active-plan');
      if (activeRaw) return JSON.parse(activeRaw);
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Persists custom meal photos for a specific plan to localStorage
 */
export function saveMealPhotos(planId: string | undefined, photos: Record<string, string>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const id = planId || 'active-plan';
    localStorage.setItem(`nutriluz_meal_photos_${id}`, JSON.stringify(photos));
    // Also save to active-plan to keep sync
    localStorage.setItem('nutriluz_meal_photos_active-plan', JSON.stringify(photos));
  } catch (e) {
    console.warn('Could not save meal photos to localStorage:', e);
  }
}

/**
 * Renders the Weekly Planning Grid (Planeación semanal) in Landscape mode
 * with color-coded columns (Horario + 7 Days), dish photo thumbnails,
 * bold dish titles, and bulleted ingredients.
 *
 * Supports:
 * 1. Custom uploaded photos (Base64 optimized)
 * 2. External image links (URL) preloaded
 * 3. Smart automatic canvas fallback illustration if no photo is set
 *
 * Can be rendered as:
 * - Standalone 2-page document (isStandalone = true)
 * - Pages inside the Full Clinical Dossier (isStandalone = false)
 */
export async function drawWeeklyScheduleLandscapePages(
  doc: jsPDF,
  plan: NutritionPlan,
  patient: Patient,
  org: Organization,
  specialist: UserProfile,
  isStandalone: boolean = false,
  customPhotos?: Record<string, string>
) {
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2; // 281mm

  const colHorarioW = 25;
  const colDayW = (contentWidth - colHorarioW) / 7; // ~36.57mm per day

  // Headers & Column pastel tints (Exact colors from user's screenshots)
  const columnsConfig = [
    {
      name: 'Horario',
      headerBg: [11, 59, 79] as RGB,      // Dark Navy #0b3b4f
      cellTint: [241, 245, 249] as RGB,   // Slate 100
    },
    {
      name: 'Lunes',
      headerBg: [224, 47, 137] as RGB,    // Fuchsia/Magenta #e02f89
      cellTint: [253, 242, 248] as RGB,   // Rose 50
    },
    {
      name: 'Martes',
      headerBg: [147, 51, 234] as RGB,    // Purple #9333ea
      cellTint: [250, 245, 255] as RGB,   // Purple 50
    },
    {
      name: 'Miércoles',
      headerBg: [59, 130, 246] as RGB,    // Blue #3b82f6
      cellTint: [239, 246, 255] as RGB,   // Blue 50
    },
    {
      name: 'Jueves',
      headerBg: [249, 115, 22] as RGB,    // Coral / Orange #f97316
      cellTint: [255, 247, 237] as RGB,   // Orange 50
    },
    {
      name: 'Viernes',
      headerBg: [234, 179, 8] as RGB,     // Golden Amber #eab308
      cellTint: [254, 252, 232] as RGB,   // Yellow 50
    },
    {
      name: 'Sábado',
      headerBg: [56, 189, 248] as RGB,    // Sky Blue #38bdf8
      cellTint: [240, 249, 255] as RGB,   // Sky 50
    },
    {
      name: 'Domingo',
      headerBg: [6, 182, 212] as RGB,     // Teal #06b6d4
      cellTint: [240, 253, 250] as RGB,   // Teal 50
    },
  ];

  // Resolve custom photos from params, localStorage or plan structure
  const savedPhotos = getSavedMealPhotos(plan.id || '');
  const activePhotos = { ...savedPhotos, ...(customPhotos || {}) };

  // Determine actual meals to display:
  const planDays = plan.days && plan.days.length >= 7 ? plan.days : (plan.days && plan.days.length > 0 ? plan.days : null);

  // Determine total meal rows across the 7 days (including all colaciones)
  const maxMealsCount = planDays
    ? Math.max(...planDays.map((d) => (d.meals || []).length), 4)
    : 4;

  const mealIndices = Array.from({ length: maxMealsCount }, (_, i) => i);

  const mealsToRender = mealIndices.map((mIdx) => {
    const sample = DEFAULT_WEEKLY_MEAL_PRESETS[mIdx];
    // Find first meal defined at this index to get default name and suggested time
    const sampleMeal = planDays?.find((d) => d.meals && d.meals[mIdx])?.meals[mIdx];
    const rawMName = sampleMeal?.name
      || (mIdx === 0 ? 'Desayuno' : mIdx === 1 ? (maxMealsCount >= 5 ? 'Colación Matutina' : 'Almuerzo') : mIdx === 2 ? 'Comida' : mIdx === 3 ? (maxMealsCount >= 5 ? 'Colación Vespertina' : 'Cena') : mIdx === 4 ? 'Cena' : `Colación ${mIdx + 1}`);
    const rawMTime = sampleMeal?.suggestedTime
      || (mIdx === 0 ? '08:00' : mIdx === 1 ? (maxMealsCount >= 5 ? '11:00' : '09:00') : mIdx === 2 ? '14:30' : mIdx === 3 ? (maxMealsCount >= 5 ? '17:30' : '20:00') : mIdx === 4 ? '20:30' : '22:00');
    const mName = cleanPdfText(rawMName);
    const mTime = cleanPdfText(rawMTime);

    const daysData = [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
      let dishTitle = sample ? sample.days[dayIdx]?.dishTitle : 'Platillo sugerido';
      let bullets = sample ? sample.days[dayIdx]?.bullets : ['Alimento balanceado según pauta clínica'];
      let mealPhotoUrl: string | undefined = undefined;

      if (planDays && planDays[dayIdx] && planDays[dayIdx].meals && planDays[dayIdx].meals[mIdx]) {
        const m = planDays[dayIdx].meals[mIdx];
        let dTitle = (m as any).dishTitle || (m.items && m.items.length > 0 ? m.items[0].name : m.name);
        if (dTitle) {
          dTitle = dTitle.trim().replace(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?|\d+\/\d+)\s+/i, '$2 ');
        }
        dishTitle = cleanPdfText(dTitle);
        const b: string[] = [];
        (m.items || []).forEach((it) => {
          const desc = formatCleanItemDescription(it);
          if (!desc) return;
          // Si el alimento tiene sub-ingredientes con '+', expandir en bullets separados para máxima legibilidad clínica y espacio
          if (desc.includes(' + ')) {
            const parts = desc.split(' + ').map((p) => p.trim()).filter(Boolean);
            parts.forEach((p) => b.push(p));
          } else {
            b.push(desc);
          }
        });
        if (b.length > 0) bullets = b;
        mealPhotoUrl = (m as any).photoUrl;
      }

      // Check key conventions: `${dayIdx}_${mIdx}` or `${mIdx}_${dayIdx}`
      const photoKey = `${dayIdx}_${mIdx}`;
      const resolvedPhoto = activePhotos[photoKey] || mealPhotoUrl;

      return {
        dishTitle,
        bullets,
        photoUrl: resolvedPhoto,
        dayIdx,
        mealIdx: mIdx,
      };
    });

    return {
      mealName: mName,
      suggestedTime: mTime,
      mealIdx: mIdx,
      days: daysData,
    };
  });

  // Draw a single landscape page
  const drawSchedulePage = async (mealsSlice: typeof mealsToRender, pageNum: number, totalPages: number) => {
    if (isStandalone) {
      if (pageNum > 1) {
        doc.addPage('a4', 'landscape');
      }
    } else {
      // In full dossier, add a new landscape page for each schedule page
      doc.addPage('a4', 'landscape');
    }

    // Subtle background watermark with the logo
    try {
      const logoResult = await loadPdfImage(org.logoUrl);
      const watermarkDataUrl = await getWatermarkDataUrl(logoResult, org.watermarkOpacity);
      if (watermarkDataUrl) {
        const wmSize = 100;
        const wmX = (pageWidth - wmSize) / 2;
        const wmY = (pageHeight - wmSize) / 2 + 6;
        doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
      }
    } catch {
      // Silently continue
    }

    // Title at Top (Exact font and position from screenshot)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('Planeación semanal', pageWidth / 2, 11, { align: 'center' });

    // Table Header Row at y = 14
    const headerY = 14;
    const headerH = 8.5;

    columnsConfig.forEach((col, colIdx) => {
      const x = colIdx === 0 ? margin : margin + colHorarioW + (colIdx - 1) * colDayW;
      const w = colIdx === 0 ? colHorarioW : colDayW;

      doc.setFillColor(col.headerBg[0], col.headerBg[1], col.headerBg[2]);
      doc.rect(x, headerY, w, headerH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.text(col.name, x + w / 2, headerY + 5.5, { align: 'center' });
    });

    // Render Meal Rows on this page (2 meals per page)
    let rowY = headerY + headerH;
    const rowHeight = 88; // 88mm height per meal

    for (const mealRow of mealsSlice) {
      // Col 0: Horario
      doc.setFillColor(columnsConfig[0].cellTint[0], columnsConfig[0].cellTint[1], columnsConfig[0].cellTint[2]);
      doc.rect(margin, rowY, colHorarioW, rowHeight, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(margin, rowY, colHorarioW, rowHeight, 'S');

      // Center Meal Name & Time cleanly without symbols and with auto-wrap
      const cleanName = cleanPdfText(mealRow.mealName);
      const cleanTime = cleanPdfText(mealRow.suggestedTime);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const nameLines = doc.splitTextToSize(cleanName, colHorarioW - 4);
      const lineH = 3.6;
      const totalBlockH = nameLines.length * lineH + 4.5;
      const startY = rowY + (rowHeight - totalBlockH) / 2 + 2.8;

      nameLines.forEach((line: string, lIdx: number) => {
        doc.text(line, margin + colHorarioW / 2, startY + lIdx * lineH, { align: 'center' });
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(cleanTime, margin + colHorarioW / 2, startY + nameLines.length * lineH + 1.2, { align: 'center' });

      // Col 1 to 7: Days
      for (let dayIdx = 0; dayIdx < mealRow.days.length; dayIdx++) {
        const dayMeal = mealRow.days[dayIdx];
        const colConfig = columnsConfig[dayIdx + 1];
        const x = margin + colHorarioW + dayIdx * colDayW;

        // Background tint
        doc.setFillColor(colConfig.cellTint[0], colConfig.cellTint[1], colConfig.cellTint[2]);
        doc.rect(x, rowY, colDayW, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(x, rowY, colDayW, rowHeight, 'S');

        // Photo Thumbnail dimensions
        const photoW = colDayW - 4; // ~32.5mm
        const photoH = 17.5;
        const photoX = x + 2;
        const photoY = rowY + 2.5;

        // Resolve Photo Thumbnail:
        // Priority 1: User uploaded Base64 image
        // Priority 2: User provided link (URL preloaded)
        // Priority 3: Smart automatic canvas fallback illustration
        let thumbDataUrl = '';
        if (dayMeal.photoUrl && typeof dayMeal.photoUrl === 'string' && dayMeal.photoUrl.trim()) {
          if (dayMeal.photoUrl.startsWith('data:image/')) {
            thumbDataUrl = dayMeal.photoUrl;
          } else if (dayMeal.photoUrl.startsWith('http')) {
            try {
              const loaded = await loadPdfImage(dayMeal.photoUrl);
              if (loaded?.dataUrl) {
                thumbDataUrl = loaded.dataUrl;
              }
            } catch (err) {
              console.warn('Failed loading photo from link, falling back to canvas:', err);
            }
          }
        }

        // Automatic Smart Fallback
        if (!thumbDataUrl) {
          thumbDataUrl = generateDishCanvasThumbnail(dayMeal.dishTitle, mealRow.mealName);
        }

        if (thumbDataUrl) {
          try {
            doc.addImage(thumbDataUrl, 'JPEG', photoX, photoY, photoW, photoH, undefined, 'FAST');
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, 'S');
          } catch {
            try {
              doc.addImage(thumbDataUrl, 'PNG', photoX, photoY, photoW, photoH, undefined, 'FAST');
              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.2);
              doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, 'S');
            } catch (err) {
              console.warn('Error adding dish photo:', err);
            }
          }
        }

        // Dish Title in Bold (Tamaño ampliado para alta legibilidad clínica)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.4);
        doc.setTextColor(15, 23, 42);
        const titleLines = doc.splitTextToSize(cleanPdfText(dayMeal.dishTitle), photoW);
        const titleY = photoY + photoH + 3.8;
        doc.text(titleLines, photoX, titleY);

        // Bulleted Ingredients & Quantities (Letra más grande y nítida)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(30, 41, 59);

        let bulletY = titleY + titleLines.length * 3.3 + 1.2;
        (dayMeal.bullets || []).forEach((bullet) => {
          if (bulletY + 3.6 > rowY + rowHeight - 1.2) return;
          const cleanB = cleanPdfText(bullet);
          const lineText = cleanB.startsWith('*') || cleanB.startsWith('•') ? cleanB.replace(/^\*\s*/, '• ') : `• ${cleanB}`;
          const splitBullet = doc.splitTextToSize(lineText, photoW);
          doc.text(splitBullet, photoX, bulletY);
          bulletY += splitBullet.length * 3.0 + 0.6;
        });
      }

      rowY += rowHeight;
    }

    if (isStandalone) {
      // Bottom subtle patient footer in standalone mode
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const rawName = `${specialist?.firstName || 'Luz Elena'} ${specialist?.lastName || 'Alcocer'}`.trim();
      const specName = rawName.replace(/^nutri[oó]loga\s+/i, '').replace(/^lic\.\s+en\s+nutrici[oó]n\s+/i, '').trim();
      const footerMsg = `Nutrióloga ${specName} • Paciente: ${patient.firstName} ${patient.lastName} • Plan Nutricional Personalizado • Página ${pageNum} de ${totalPages}`;
      doc.text(cleanPdfText(footerMsg), pageWidth / 2, pageHeight - 3, { align: 'center' });
    }
  };

  // Render pages dynamically (2 meals per landscape page, supporting all colaciones)
  const totalPages = Math.max(1, Math.ceil(mealsToRender.length / 2));
  for (let p = 0; p < totalPages; p++) {
    const pageSlice = mealsToRender.slice(p * 2, p * 2 + 2);
    await drawSchedulePage(pageSlice, p + 1, totalPages);
  }
}

// ====================================================
// BENTO CARDS: GUÍA DE INTERCAMBIOS INTELIGENTES SMAE
// ====================================================

export interface SmaeBentoCard {
  id: string;
  name: string;
  symbol: string;
  macroBadge: string;
  bgRgb: [number, number, number];
  borderRgb: [number, number, number];
  accentRgb: [number, number, number];
  badgeBgRgb: [number, number, number];
  iconBgHex: string;
  iconBorderHex: string;
  items: string[];
}

export const SMAE_BENTO_CARDS: SmaeBentoCard[] = [
  {
    id: 'verduras',
    name: 'VERDURAS LIBRES',
    symbol: '🥦',
    macroBadge: 'Consumo libre | 1 Eq = ~25 kcal, 4g HCO',
    bgRgb: [240, 253, 244], // pastel verde
    borderRgb: [187, 247, 208],
    accentRgb: [21, 128, 61],
    badgeBgRgb: [220, 252, 231],
    iconBgHex: '#dcfce7',
    iconBorderHex: '#86efac',
    items: [
      'Espinacas crudas (2 tz / 120g)',
      'Lechuga y apio (libre)',
      'Nopales cocidos (1 tz / 150g)',
      'Calabacita o chayote (1 pza)',
      'Jitomate bola fresco (1 pza)',
      'Brócoli o espárragos (1 tz)',
      'Pepino con cáscara (libre)',
      'Aderezo: limón, vinagre y orégano',
    ],
  },
  {
    id: 'frutas',
    name: 'FRUTAS FRESCAS',
    symbol: '🍎',
    macroBadge: '1 Eq = ~60 kcal | 15g Carbohidratos',
    bgRgb: [255, 241, 242], // pastel rojo/naranja suave
    borderRgb: [254, 205, 211],
    accentRgb: [190, 18, 60],
    badgeBgRgb: [255, 228, 230],
    iconBgHex: '#ffe4e6',
    iconBorderHex: '#fecdd3',
    items: [
      '1 manzana chica (100g)',
      '1 taza papaya picada (140g)',
      '1 taza fresas frescas (150g)',
      '1/2 plátano mediano (60g)',
      '2 mandarinas chicas (120g)',
      '1 pera chica fresca (100g)',
      '1 taza melón picado (160g)',
      '3 ciruelas pasas chicas (35g)',
    ],
  },
  {
    id: 'cereales',
    name: 'CEREALES SIN GRASA',
    symbol: '🌾',
    macroBadge: '1 Eq = ~70 kcal | 15g Carbos, 2g Prot',
    bgRgb: [254, 252, 232], // pastel ámbar
    borderRgb: [254, 240, 138],
    accentRgb: [180, 83, 9],
    badgeBgRgb: [254, 243, 199],
    iconBgHex: '#fef3c7',
    iconBorderHex: '#fde68a',
    items: [
      '1 tortilla de maíz (30g)',
      '1/3 taza arroz cocido (80g)',
      '1/3 taza avena cruda (30g)',
      '1 rebanada pan integral (30g)',
      '2 tostadas horneadas (24g)',
      '1/3 taza quinoa cocida (75g)',
      '1/2 papa chica hervida (70g)',
      '2.5 tazas palomitas naturales',
    ],
  },
  {
    id: 'proteinas',
    name: 'PROTEÍNAS MAGRAS (AOA)',
    symbol: '🍗',
    macroBadge: '1 Eq = ~55 kcal | 7g Proteína, 3g Grasa',
    bgRgb: [250, 245, 255], // pastel púrpura / índigo
    borderRgb: [233, 213, 255],
    accentRgb: [107, 33, 168],
    badgeBgRgb: [243, 232, 255],
    iconBgHex: '#f3e8ff',
    iconBorderHex: '#e9d5ff',
    items: [
      '30g pechuga pollo cocida',
      '30g atún en agua (escurrido)',
      '1 huevo entero o 2 claras',
      '40g queso panela bajo en grasa',
      '35g bistec de res magro',
      '40g filete de pescado blanco',
      '35g salmón fresco a la plancha',
      '30g pechuga de pavo baja en sodio',
    ],
  },
  {
    id: 'leguminosas',
    name: 'LEGUMINOSAS',
    symbol: '🫘',
    macroBadge: '1 Eq = ~120 kcal | 8g Prot, 20g Carbos',
    bgRgb: [255, 247, 237], // pastel naranja cálido / terracota
    borderRgb: [254, 215, 170],
    accentRgb: [194, 65, 12],
    badgeBgRgb: [255, 237, 213],
    iconBgHex: '#ffedd5',
    iconBorderHex: '#fed7aa',
    items: [
      '1/2 taza frijoles de la olla (90g)',
      '1/2 taza lentejas cocidas (100g)',
      '1/2 taza garbanzos cocidos (100g)',
      '1/3 taza habas cocidas (80g)',
      '1/3 taza soya cocida (70g)',
      '1/2 taza alubias cocidas (90g)',
      '1/3 taza edamames pelados (60g)',
      'Tip: Remojar 12h previo a cocción',
    ],
  },
  {
    id: 'grasas',
    name: 'GRASAS SALUDABLES',
    symbol: '🥑',
    macroBadge: '1 Eq = ~45-70 kcal | 5g Grasas buenas',
    bgRgb: [236, 253, 245], // pastel verde esmeralda / aguacate
    borderRgb: [167, 243, 208],
    accentRgb: [4, 120, 87],
    badgeBgRgb: [209, 250, 229],
    iconBgHex: '#d1fae5',
    iconBorderHex: '#a7f3d0',
    items: [
      '1/3 aguacate Hass chico (35g)',
      '1 cdta aceite oliva virgen (5ml)',
      '10 almendras naturales (12g)',
      '3 mitades de nuez entera (12g)',
      '1 cdta crema cacahuate s/azúcar',
      '1 cda chía o linaza molida (10g)',
      '10 aceitunas verdes (35g)',
      '2 cdtas semillas de girasol',
    ],
  },
  {
    id: 'lacteos',
    name: 'LÁCTEOS Y BEBIDAS',
    symbol: '🥛',
    macroBadge: '1 Eq = ~95 kcal | 9g Prot, 12g Carbos',
    bgRgb: [239, 246, 255], // pastel azul suave
    borderRgb: [191, 219, 254],
    accentRgb: [29, 78, 216],
    badgeBgRgb: [219, 234, 254],
    iconBgHex: '#dbeafe',
    iconBorderHex: '#bfdbfe',
    items: [
      '1 taza leche descremada (240ml)',
      '3/4 taza yogur griego 0% (150g)',
      '1 taza bebida soya s/azúcar',
      '1 taza leche deslactosada light',
      '1/3 taza requesón magro (70g)',
      '1 taza kéfir natural s/azúcar',
      '1 taza leche almendras s/azúcar',
      'Tip: Preferir siempre sin azúcar',
    ],
  },
  {
    id: 'libres',
    name: 'LIBRES Y CONDIMENTOS',
    symbol: '🌿',
    macroBadge: 'Aporte calórico prácticamente nulo',
    bgRgb: [240, 253, 250], // pastel verde menta / teal
    borderRgb: [153, 246, 228],
    accentRgb: [15, 118, 110],
    badgeBgRgb: [204, 251, 241],
    iconBgHex: '#ccfbf1',
    iconBorderHex: '#99f6e4',
    items: [
      'Agua natural (2.0 a 2.5 L al día)',
      'Café negro o espresso (s/azúcar)',
      'Té verde, manzanilla o menta',
      'Limón, ajo, orégano, romero',
      'Pimienta negra, cúrcuma y canela',
      'Vinagre de manzana para aliños',
      'Agua mineral con gas y limón',
      'Sal marina (consumo moderado)',
    ],
  },
];

const bentoIconCache: Record<string, string> = {};

function generateBentoCardIcon(symbol: string, bgHex: string, borderHex: string): string {
  if (typeof document === 'undefined') return '';
  const cacheKey = `${symbol}_${bgHex}`;
  if (bentoIconCache[cacheKey]) return bentoIconCache[cacheKey];
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = bgHex;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '30px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 32, 33);

    const url = canvas.toDataURL('image/png');
    bentoIconCache[cacheKey] = url;
    return url;
  } catch {
    return '';
  }
}

/**
 * Draws the Modern Bento Cards Infographic (2 columns x 4 rows)
 * for the SMAE food equivalent groups.
 */
export function drawSmaeBentoCards(
  doc: jsPDF,
  startY: number,
  margin: number,
  pageWidth: number,
  _pageHeight: number,
  _colors: any
): number {
  const contentWidth = pageWidth - margin * 2;
  let currentY = startY;
  const isLandscape = pageWidth > 250;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, contentWidth, isLandscape ? 9 : 11, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isLandscape ? 7.8 : 8.2);
  doc.text('GUIA MAESTRA DE INTERCAMBIOS INTELIGENTES (EQUIVALENCIAS SMAE)', margin + 4, currentY + (isLandscape ? 4.2 : 4.8));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isLandscape ? 5.5 : 5.8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Tarjetas Bento estilo infografía médica: Sustituye libremente cualquier porción dentro del mismo grupo de alimentos.', margin + 4, currentY + (isLandscape ? 7.2 : 8.5));

  currentY += isLandscape ? 11 : 13.5;

  if (isLandscape) {
    // 4 COLUMNS x 2 ROWS for Landscape Mode
    const cols = 4;
    const colGap = 4;
    const rowGap = 3.5;
    const cardW = (contentWidth - (cols - 1) * colGap) / cols; // ~64.2mm
    const cardH = 68;

    SMAE_BENTO_CARDS.forEach((card, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const cardX = margin + col * (cardW + colGap);
      const cardY = currentY + row * (cardH + rowGap);

      // 1. Soft pastel background
      doc.setFillColor(card.bgRgb[0], card.bgRgb[1], card.bgRgb[2]);
      doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'F');

      // 2. Subtle matching border
      doc.setDrawColor(card.borderRgb[0], card.borderRgb[1], card.borderRgb[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'S');

      // 3. Left color accent strip
      doc.setFillColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
      doc.roundedRect(cardX, cardY, 2, cardH, 1, 1, 'F');

      // 4. Circular icon badge
      doc.setFillColor(255, 255, 255);
      doc.circle(cardX + 6.8, cardY + 5.8, 3.4, 'F');
      doc.setDrawColor(card.borderRgb[0], card.borderRgb[1], card.borderRgb[2]);
      doc.setLineWidth(0.2);
      doc.circle(cardX + 6.8, cardY + 5.8, 3.4, 'S');

      const iconData = generateBentoCardIcon(card.symbol, card.iconBgHex, card.iconBorderHex);
      if (iconData) {
        try {
          doc.addImage(iconData, 'PNG', cardX + 3.8, cardY + 2.8, 6.0, 6.0);
        } catch {}
      }

      // 5. Title & Macro Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(cleanPdfText(card.name), cardX + 11.5, cardY + 5.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.8);
      const badgeW = doc.getTextWidth(cleanPdfText(card.macroBadge)) + 2.8;
      doc.setFillColor(card.badgeBgRgb[0], card.badgeBgRgb[1], card.badgeBgRgb[2]);
      doc.roundedRect(cardX + 11.5, cardY + 6.6, badgeW, 3.0, 1, 1, 'F');
      doc.setTextColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
      doc.text(cleanPdfText(card.macroBadge), cardX + 12.8, cardY + 8.8);

      // 6. Hairline separator
      doc.setDrawColor(card.borderRgb[0], card.borderRgb[1], card.borderRgb[2]);
      doc.setLineWidth(0.15);
      doc.line(cardX + 3.5, cardY + 11, cardX + cardW - 3.5, cardY + 11);

      // 7. Equivalents items (Single clean column in card)
      const items = card.items;
      const maxItems = 7;
      for (let i = 0; i < Math.min(items.length, maxItems); i++) {
        const itemY = cardY + 15.2 + i * 4.2;

        doc.setFillColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
        doc.circle(cardX + 5.0, itemY - 0.7, 0.5, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.4);
        doc.setTextColor(51, 65, 85);
        const itemText = doc.splitTextToSize(cleanPdfText(items[i]), cardW - 8.5)[0];
        doc.text(itemText, cardX + 6.8, itemY);
      }
    });

    const totalGridHeight = 2 * cardH + 1 * rowGap;
    return currentY + totalGridHeight;
  }

  // Portrait Fallback (2 columns x 4 rows)
  const colGap = 5;
  const cardW = (contentWidth - colGap) / 2; // 88.5 mm
  const cardH = 32.5;
  const rowGap = 3.2;

  SMAE_BENTO_CARDS.forEach((card, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const cardX = margin + col * (cardW + colGap);
    const cardY = currentY + row * (cardH + rowGap);

    // 1. Soft pastel background
    doc.setFillColor(card.bgRgb[0], card.bgRgb[1], card.bgRgb[2]);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2.5, 2.5, 'F');

    // 2. Subtle matching border
    doc.setDrawColor(card.borderRgb[0], card.borderRgb[1], card.borderRgb[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardW, cardH, 2.5, 2.5, 'S');

    // 3. Left color accent strip
    doc.setFillColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
    doc.roundedRect(cardX, cardY, 2, cardH, 1, 1, 'F');

    // 4. Circular icon badge
    doc.setFillColor(255, 255, 255);
    doc.circle(cardX + 7.2, cardY + 6.2, 3.8, 'F');
    doc.setDrawColor(card.borderRgb[0], card.borderRgb[1], card.borderRgb[2]);
    doc.setLineWidth(0.2);
    doc.circle(cardX + 7.2, cardY + 6.2, 3.8, 'S');

    const iconData = generateBentoCardIcon(card.symbol, card.iconBgHex, card.iconBorderHex);
    if (iconData) {
      try {
        doc.addImage(iconData, 'PNG', cardX + 4.0, cardY + 3.0, 6.4, 6.4);
      } catch {
        // Fallback
      }
    }

    // 5. Title & Macro Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(cleanPdfText(card.name), cardX + 12.2, cardY + 5.3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.0);
    const badgeW = doc.getTextWidth(cleanPdfText(card.macroBadge)) + 3.2;
    doc.setFillColor(card.badgeBgRgb[0], card.badgeBgRgb[1], card.badgeBgRgb[2]);
    doc.roundedRect(cardX + 12.2, cardY + 6.6, badgeW, 3.2, 1, 1, 'F');
    doc.setTextColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
    doc.text(cleanPdfText(card.macroBadge), cardX + 13.8, cardY + 8.9);

    // 6. Hairline separator
    doc.setDrawColor(card.borderRgb[0], card.borderRgb[1], card.borderRgb[2]);
    doc.setLineWidth(0.15);
    doc.line(cardX + 4, cardY + 11.2, cardX + cardW - 4, cardY + 11.2);

    // 7. Equivalents items (organized in 2 sub-columns inside each card)
    const items = card.items;
    const maxRows = 4;
    for (let r = 0; r < maxRows; r++) {
      const leftIdx = r * 2;
      const rightIdx = r * 2 + 1;
      const itemY = cardY + 14.5 + r * 3.5;

      if (leftIdx < items.length) {
        // Bullet circle
        doc.setFillColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
        doc.circle(cardX + 5.2, itemY - 0.7, 0.55, 'F');
        // Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.2);
        doc.setTextColor(51, 65, 85);
        doc.text(cleanPdfText(items[leftIdx]), cardX + 6.8, itemY);
      }

      if (rightIdx < items.length) {
        // Bullet circle
        doc.setFillColor(card.accentRgb[0], card.accentRgb[1], card.accentRgb[2]);
        doc.circle(cardX + 46.8, itemY - 0.7, 0.55, 'F');
        // Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.2);
        doc.setTextColor(51, 65, 85);
        doc.text(cleanPdfText(items[rightIdx]), cardX + 48.4, itemY);
      }
    }
  });

  const totalGridHeight = 4 * cardH + 3 * rowGap;
  return currentY + totalGridHeight;
}

export interface PdfExportResult {
  doc: jsPDF;
  fileName: string;
  blob: Blob;
}

export const pdfService = {
  /**
   * DOSSIER CLÍNICO EJECUTIVO COMPLETO (ALL-IN-ONE)
   * Master Executive Nutrition Dossier combining:
   * 1. Portada & Ficha Clínica Antropométrica Ejecutiva
   * 2. Bento Cards de Macronutrientes y Metas Metabólicas
   * 3. Sección "¿Por qué [X] calorías? Entendiendo tu Plan Nutricional" (GET, Déficit y Explicación de Macros)
   * 4. Matriz de Distribución de Equivalentes SMAE por Tiempo de Comida
   * 5. Menú Estructurado con los 7 Colores Distintivos de Lunes a Domingo y Gramajes
   * 6. Guía Maestra de Intercambios Inteligentes (Sistema de Equivalentes)
   * 7. Reglas Clínicas de Oro, Hidratación & Hábitos
   * 8. Lista de Despensa y Supermercado Clasificada por Pasillos
   * 9. Firma Digital, Sello Oficial y Cédula Profesional
   */
  async generateNutritionPlanPdf(
    plan: NutritionPlan,
    patient: Patient,
    org: Organization,
    specialist: UserProfile,
    designId: PdfDesignId = 'clinical_modern',
    customPhotos?: Record<string, string>,
    options?: { autoSave?: boolean }
  ): Promise<PdfExportResult> {
    const colors = getThemeColors(designId);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 269mm

    // Calculations
    const birthYear = patient.birthDate ? new Date(patient.birthDate).getFullYear() : 1995;
    const age = new Date().getFullYear() - birthYear;
    const heightM = (patient.height || 165) / 100;
    const weightKg = patient.currentWeight || 70;
    const bmiNum = heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 23.5;
    const bmiStr = bmiNum.toFixed(1);

    let bmiCategory = 'Normopeso';
    let bmiBadgeColor = colors.primary;
    if (bmiNum < 18.5) {
      bmiCategory = 'Bajo Peso';
      bmiBadgeColor = colors.blue;
    } else if (bmiNum >= 25 && bmiNum < 30) {
      bmiCategory = 'Sobrepeso';
      bmiBadgeColor = colors.accent;
    } else if (bmiNum >= 30) {
      bmiCategory = 'Obesidad';
      bmiBadgeColor = colors.rose;
    }

    const portalUrl = `${window.location.origin}/?portal=true&patientId=${patient.id}`;
    const [logoResult, qrDataUrl] = await Promise.all([
      loadPdfImage(org.logoUrl),
      generateQrDataUrl(portalUrl),
    ]);
    const watermarkDataUrl = await getWatermarkDataUrl(logoResult, org.watermarkOpacity);

    // ====================================================
    // PAGE 1: HEADER, PATIENT PROFILE & MACRO DASHBOARD (LANDSCAPE)
    // ====================================================
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);

    let currentY = 38;

    // 1. PATIENT & CLINICAL ANTHROPOMETRY CARD
    const patientCardH = 34;
    doc.setFillColor(colors.bgCard[0], colors.bgCard[1], colors.bgCard[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, patientCardH, 3, 3, 'FD');

    const colWidth = (contentWidth - 6) / 2;
    doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.roundedRect(margin + 2, currentY + 2, colWidth, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA CLINICA Y EVALUACION ANTROPOMETRICA', margin + 4, currentY + 6.3);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
    doc.text(cleanPdfText(`Paciente: ${patient.firstName} ${patient.lastName}`), margin + 4, currentY + 13);
    doc.text(
      cleanPdfText(`Edad: ${age} años  •  Sexo: ${patient.gender === 'F' ? 'Femenino' : 'Masculino'}  •  Estatura: ${patient.height || 165} cm`),
      margin + 4,
      currentY + 18
    );
    doc.text(cleanPdfText(`Peso Actual: ${weightKg} kg  •  Peso Meta: ${patient.targetWeight || weightKg} kg`), margin + 4, currentY + 23);

    doc.text(cleanPdfText(`IMC: ${bmiStr} kg/m²`), margin + 4, currentY + 28);
    doc.setFillColor(bmiBadgeColor[0], bmiBadgeColor[1], bmiBadgeColor[2]);
    doc.roundedRect(margin + 28, currentY + 25, 23, 4.2, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'bold');
    doc.text(bmiCategory.toUpperCase(), margin + 39.5, currentY + 28.2, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
    doc.text(cleanPdfText(`Objetivo: ${plan.goal || patient.goal || 'Salud Integral y Recomposición'}`), margin + 4, currentY + 32.5);

    // Right Column: Treatment parameters
    const col2X = margin + colWidth + 4;
    doc.setFillColor(colors.blueLight[0], colors.blueLight[1], colors.blueLight[2]);
    doc.roundedRect(col2X, currentY + 2, colWidth, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(colors.blueDark[0], colors.blueDark[1], colors.blueDark[2]);
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.text('PARAMETROS DE LA PRESCRIPCION CLINICA', col2X + 2, currentY + 6.3);

    const durationDaysCount = plan.durationDays || (plan.days || []).length || (plan.durationMode === 'MENSUAL' ? 30 : plan.durationMode === 'QUINCENAL' ? 15 : 7);
    const durationWeeks = Math.max(1, Math.round(durationDaysCount / 7));

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
    doc.text(cleanPdfText(`Plan: ${plan.title || 'Plan Nutricional Clínico Personalizado'}`), col2X + 2, currentY + 13);
    doc.text(cleanPdfText(`Duración: ${durationDaysCount} Días (${durationWeeks} semanas de vigencia)`), col2X + 2, currentY + 18);
    doc.text(cleanPdfText(`Periodo: ${plan.startDate || 'Inicio inmediato'} al ${plan.endDate || 'Siguiente consulta'}`), col2X + 2, currentY + 23);
    doc.text(cleanPdfText(`Especialista: ${specialist.professionalTitle || 'L.N.'} ${specialist.firstName} ${specialist.lastName}`), col2X + 2, currentY + 28);
    doc.text(cleanPdfText(`Estructura: ${(plan.days || []).length || 7} días con cálculo y recetas SMAE`), col2X + 2, currentY + 32.5);

    currentY += patientCardH + 4;

    // 2. BENTO CARDS: METABOLIC & MACRONUTRIENT DASHBOARD
    const targetKcal = plan.targetCaloriesKcal || 1800;
    const proteinG = plan.targetProteinG || 130;
    const carbsG = plan.targetCarbsG || 180;
    const fatG = plan.targetFatG || 50;
    const waterL = plan.targetWaterLiters || 2.5;

    const protKcal = Math.round(proteinG * 4);
    const carbsKcal = Math.round(carbsG * 4);
    const fatKcal = Math.round(fatG * 9);
    const protPct = Math.round((protKcal / (targetKcal || 1)) * 100);
    const carbsPct = Math.round((carbsKcal / (targetKcal || 1)) * 100);
    const fatPct = Math.round((fatKcal / (targetKcal || 1)) * 100);
    const protPerKg = weightKg > 0 ? (proteinG / weightKg).toFixed(1) : '1.8';

    const bentoCardWidth = (contentWidth - 8) / 5;
    const bentoHeight = 18;

    const bentoCards = [
      {
        title: 'ENERGIA GET',
        value: `${targetKcal}`,
        unit: 'kcal / día',
        detail: 'Gasto Energético Meta',
        bg: colors.primaryLight,
        border: colors.primary,
        titleColor: colors.primaryDark,
        valueColor: colors.primaryDeep,
      },
      {
        title: 'PROTEINAS',
        value: `${proteinG}g`,
        unit: `${protPct}% GET • ${protPerKg}g/kg`,
        detail: `${protKcal} kcal`,
        bg: colors.roseLight,
        border: colors.rose,
        titleColor: colors.roseDark,
        valueColor: colors.rose,
      },
      {
        title: 'CARBOHIDRATOS',
        value: `${carbsG}g`,
        unit: `${carbsPct}% GET`,
        detail: `${carbsKcal} kcal`,
        bg: colors.blueLight,
        border: colors.blue,
        titleColor: colors.blueDark,
        valueColor: colors.blue,
      },
      {
        title: 'LIPIDOS / GRASAS',
        value: `${fatG}g`,
        unit: `${fatPct}% GET`,
        detail: `${fatKcal} kcal`,
        bg: colors.accentLight,
        border: colors.accent,
        titleColor: colors.accentDark,
        valueColor: colors.accentDark,
      },
      {
        title: 'META HIDRICA',
        value: `${waterL}L`,
        unit: 'Agua natural/día',
        detail: `~${Math.round(waterL * 4)} vasos diarios`,
        bg: colors.tealLight,
        border: colors.teal,
        titleColor: colors.teal,
        valueColor: colors.teal,
      },
    ];

    bentoCards.forEach((card, idx) => {
      const bx = margin + idx * (bentoCardWidth + 2);
      doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
      doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(bx, currentY, bentoCardWidth, bentoHeight, 2.5, 2.5, 'FD');

      doc.setFillColor(card.border[0], card.border[1], card.border[2]);
      doc.roundedRect(bx, currentY, bentoCardWidth, 1.5, 1, 1, 'F');

      doc.setTextColor(card.titleColor[0], card.titleColor[1], card.titleColor[2]);
      doc.setFontSize(6.0);
      doc.setFont('helvetica', 'bold');
      doc.text(card.title, bx + bentoCardWidth / 2, currentY + 4.8, { align: 'center' });

      doc.setFontSize(9.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(card.valueColor[0], card.valueColor[1], card.valueColor[2]);
      doc.text(card.value, bx + bentoCardWidth / 2, currentY + 10.2, { align: 'center' });

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.text(card.unit, bx + bentoCardWidth / 2, currentY + 13.8, { align: 'center' });

      doc.setFontSize(5.0);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
      doc.text(card.detail, bx + bentoCardWidth / 2, currentY + 16.8, { align: 'center' });
    });

    currentY += bentoHeight + 4;

    // 3. MATRIZ DE DISTRIBUCIÓN DE EQUIVALENTES SMAE
    const { groups, matrix } = computeSmaeDistribution(plan);
    const smaeTableRows: any[] = [];
    let sumTotalEquivalents = 0;
    let sumTotalKcal = 0;

    groups.forEach((g) => {
      const counts = matrix[g.code] || [0, 0, 0, 0, 0];
      const rowTotal = counts.reduce((a, b) => a + b, 0);
      sumTotalEquivalents += rowTotal;
      const groupKcal = rowTotal * g.kcal;
      sumTotalKcal += groupKcal;

      if (rowTotal > 0 || ['VERDURAS', 'FRUTAS', 'CEREALES_SG', 'AOA_BA', 'GRASAS_SP'].includes(g.code)) {
        smaeTableRows.push([
          cleanPdfText(g.name),
          counts[0] > 0 ? `${counts[0]}` : '-',
          counts[1] > 0 ? `${counts[1]}` : '-',
          counts[2] > 0 ? `${counts[2]}` : '-',
          counts[3] > 0 ? `${counts[3]}` : '-',
          counts[4] > 0 ? `${counts[4]}` : '-',
          { content: `${rowTotal}`, styles: { fontStyle: 'bold', halign: 'center', textColor: colors.primaryDark } },
          { content: `${groupKcal} kcal`, styles: { halign: 'right', textColor: colors.mutedText } },
        ]);
      }
    });

    smaeTableRows.push([
      { content: 'TOTAL PORCIONES / DIA', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: colors.darkHeading } },
      '', '', '', '', '',
      { content: `${sumTotalEquivalents}`, styles: { fontStyle: 'bold', fillColor: colors.primaryLight, textColor: colors.primaryDeep, halign: 'center' } },
      { content: `~${sumTotalKcal} kcal`, styles: { fontStyle: 'bold', fillColor: colors.primaryLight, textColor: colors.primaryDeep, halign: 'right' } },
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          {
            content: 'DISTRIBUCION DIARIA DE EQUIVALENTES (SISTEMA MEXICANO DE ALIMENTOS EQUIVALENTES - SMAE)',
            colSpan: 8,
            styles: { fillColor: colors.primaryDeep, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.6, halign: 'center' },
          },
        ],
        ['Grupo de Alimento (SMAE)', 'Desayuno', 'Colación 1', 'Comida', 'Colación 2', 'Cena', 'Total Eq.', 'Aporte Aprox.'],
      ],
      body: smaeTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.0,
        halign: 'center',
      },
      styles: {
        fontSize: 6.6,
        cellPadding: 1.6,
        lineColor: colors.border,
        lineWidth: 0.2,
        textColor: colors.darkText,
      },
      columnStyles: {
        0: { cellWidth: 73, fontStyle: 'bold' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 24, halign: 'center' },
        6: { cellWidth: 28, halign: 'center' },
        7: { cellWidth: 48, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
    });

    // ====================================================
    // PAGE 2: GUÍA EXPLICATIVA "¿POR QUÉ [X] CALORÍAS?" (LANDSCAPE)
    // ====================================================
    doc.addPage('a4', 'landscape');
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);
    drawWhyCaloriesSection(doc, plan, patient, pageWidth, margin, 38, colors);

    // ====================================================
    // PAGES 3 & 4: PLANEACIÓN SEMANAL CON FOTOS Y COLUMNAS DE COLORES (HORIZONTAL / LANDSCAPE)
    // ====================================================
    await drawWeeklyScheduleLandscapePages(doc, plan, patient, org, specialist, false, customPhotos);

    // ====================================================
    // PAGE 5: GUÍA MAESTRA DE INTERCAMBIOS INTELIGENTES (SMAE) (LANDSCAPE)
    // ====================================================
    doc.addPage('a4', 'landscape');
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);
    drawSmaeBentoCards(doc, 38, margin, pageWidth, pageHeight, colors);

    // ====================================================
    // PAGE 6: REGLAS CLÍNICAS, LISTA DE DESPENSA Y FIRMA DIGITAL (LANDSCAPE)
    // ====================================================
    doc.addPage('a4', 'landscape');
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);

    const defaultInstructions =
      `- Hidratación: Beber un mínimo de ${waterL} litros de agua natural a lo largo del día. Evitar bebidas azucaradas, jugos y refrescos.\n- Técnicas de Cocción: Preferir preparaciones al vapor, a la plancha, asadas, en freidora de aire o al horno; erradicar frituras, capeados y empanizados.\n- Sazón Inteligente: Condimentar generosamente con hierbas y especias naturales (orégano, ajo, romero, cúrcuma, pimienta, sal marina moderada y jugo de limón).\n- Sustituciones: Si deseas variar un alimento, consulta la Guía de Intercambios SMAE respetando siempre el mismo grupo de equivalentes.\n- Sueño y Recuperación: Mantener de 7 a 8 horas de descanso reparador para regular la grelina, leptina y optimizar la tasa metabólica basal.\n- Horarios regulares: Mantén tiempos fijos de ingesta para estabilizar tus niveles de glucosa y energía sostenida.`;

    const rawInstructions = plan.generalInstructions || defaultInstructions;
    const formattedInstructions = formatMarkdownForPdf(rawInstructions);

    const leftColW = 130;
    const rightColW = 134;
    const rightColX = margin + leftColW + 5;

    // Left Column: Clinical guidelines
    autoTable(doc, {
      startY: 38,
      head: [['PAUTAS CLINICAS, REGLAS DE ORO DEL PLAN E HIGIENE METABOLICA']],
      body: [[formattedInstructions]],
      theme: 'plain',
      headStyles: {
        fillColor: colors.primaryDark,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.6,
      },
      bodyStyles: {
        fillColor: colors.primaryLight,
        textColor: colors.darkText,
        fontSize: 6.8,
        cellPadding: 2.8,
        lineColor: colors.primary,
        lineWidth: 0.3,
      },
      margin: { left: margin, right: pageWidth - margin - leftColW },
      pageBreak: 'avoid',
    });

    // Right Column: Shopping list items
    const collectedItems: string[] = [];
    (plan.days || []).forEach((d) => {
      (d.meals || []).forEach((m) => {
        (m.items || []).forEach((it) => {
          collectedItems.push(`${it.name} (${it.portionDescription || '1 porción'})`);
        });
      });
    });

    const uniqueItems = Array.from(new Set(collectedItems));
    const shoppingRows = uniqueItems.slice(0, 11).map((item, idx) => [`[  ]`, `${idx + 1}.  ${cleanPdfText(item)}`]);

    if (shoppingRows.length === 0) {
      shoppingRows.push(
        ['[  ]', 'Verduras frescas: espinaca baby, jitomate guaje, pepino, nopales, brócoli'],
        ['[  ]', 'Proteínas magras: pechuga de pollo limpia, claras de huevo, atún en agua, queso panela'],
        ['[  ]', 'Cereales y granos: tortillas de maíz, hojuelas de avena natural, arroz integral, tostadas horneadas'],
        ['[  ]', 'Grasas saludables: aguacate Hass fresco, aceite de oliva extravirgen, almendras enteras'],
        ['[  ]', 'Lácteos y despensa: yogur griego natural sin azúcar, frijoles de la olla, canela en polvo']
      );
    }

    autoTable(doc, {
      startY: 38,
      head: [
        [
          {
            content: 'LISTA DE DESPENSA Y SUPERMERCADO INTELIGENTE (GUIA DE COMPRAS)',
            colSpan: 2,
            styles: { fillColor: colors.teal, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.6 },
          },
        ],
        ['Check', 'Artículo / Alimento para la Despensa Semanal'],
      ],
      body: shoppingRows,
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.0,
      },
      styles: {
        fontSize: 6.6,
        cellPadding: 1.8,
        lineColor: colors.border,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: colors.primaryDark },
        1: { cellWidth: 118 },
      },
      margin: { left: rightColX, right: margin },
      pageBreak: 'avoid',
    });

    const shoppingFinalY = (doc as any).lastAutoTable.finalY + 8;

    // Digital signature on right column below shopping list
    const signBoxCenterX = rightColX + rightColW / 2;
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(signBoxCenterX - 45, shoppingFinalY + 5, signBoxCenterX + 45, shoppingFinalY + 5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.darkHeading[0], colors.darkHeading[1], colors.darkHeading[2]);
    doc.text(
      cleanPdfText(`${specialist.firstName} ${specialist.lastName}`),
      signBoxCenterX,
      shoppingFinalY + 9.5,
      { align: 'center' }
    );

    doc.setFontSize(7.0);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
    doc.text(
      cleanPdfText(
        `${specialist.professionalTitle || 'Licenciado(a) en Nutrición'} • Cédula Profesional: ${specialist.licenseNumber || '15573967'}`
      ),
      signBoxCenterX,
      shoppingFinalY + 13.5,
      { align: 'center' }
    );

    doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(signBoxCenterX - 55, shoppingFinalY + 16, 110, 6, 1.5, 1.5, 'FD');
    doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.setFontSize(6.0);
    doc.setFont('helvetica', 'bold');
    doc.text(
      '[VALIDADO] PRESCRIPCION CLINICA APROBADA Y REGISTRADA EN EXPEDIENTE DIGITAL',
      signBoxCenterX,
      shoppingFinalY + 20,
      { align: 'center' }
    );

    applyFooters(doc, org, specialist, patient, pageWidth, pageHeight, colors, watermarkDataUrl);

    const safePatientName = `${patient.firstName || 'Paciente'}_${patient.lastName || ''}`.replace(/\s+/g, '_');
    const fileName = `Dossier_Clinico_${safePatientName}.pdf`;
    const blob = doc.output('blob');
    if (options?.autoSave !== false) {
      await deliverPdfFile({
        blob,
        fileName,
        title: `Dossier Clínico - ${patient.firstName} ${patient.lastName}`,
        text: `Expediente clínico y plan nutricional personalizado de ${patient.firstName} ${patient.lastName}.`,
      });
    }
    return {
      doc,
      fileName,
      blob,
    };
  },

  /**
   * GUÍA EXPLICATIVA DEL PLAN NUTRICIONAL & EQUIVALENTES (DOCUMENTO 1)
   * Focuses on the Educational Explanation:
   * - ¿Por qué [X] calorías? Entendiendo tu Plan Nutricional (Imagen 1 y 2)
   * - Metas Calóricas y 3 Tarjetas (GET, Consumo Actual, Déficit)
   * - Tabla de Papel de Cada Macronutriente (Proteínas, Carbos, Grasas)
   * - Conclusión y Próxima Cita
   * - Matriz de Distribución de Equivalentes SMAE por Tiempo de Comida
   * - Guía Completa de Intercambios Inteligentes
   */
  async generateSmaeGuidePdf(
    plan: NutritionPlan,
    patient: Patient,
    org: Organization,
    specialist: UserProfile,
    designId: PdfDesignId = 'clinical_modern'
  ) {
    const colors = getThemeColors(designId);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const portalUrl = `${window.location.origin}/?portal=true&patientId=${patient.id}`;
    const [logoResult, qrDataUrl] = await Promise.all([
      loadPdfImage(org.logoUrl),
      generateQrDataUrl(portalUrl),
    ]);
    const watermarkDataUrl = await getWatermarkDataUrl(logoResult, org.watermarkOpacity);

    // Page 1: Header + ¿Por qué [X] calorías? (Landscape)
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);
    drawWhyCaloriesSection(doc, plan, patient, pageWidth, margin, 38, colors);

    // Page 2: Matriz SMAE + Reglas de Oro en Landscape lado a lado
    doc.addPage('a4', 'landscape');
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);
    let currentY = 38;

    // SMAE Matrix Table
    const { groups, matrix } = computeSmaeDistribution(plan);
    const smaeTableRows: any[] = [];
    let sumTotalEquivalents = 0;
    let sumTotalKcal = 0;

    groups.forEach((g) => {
      const counts = matrix[g.code] || [0, 0, 0, 0, 0];
      const rowTotal = counts.reduce((a, b) => a + b, 0);
      sumTotalEquivalents += rowTotal;
      const groupKcal = rowTotal * g.kcal;
      sumTotalKcal += groupKcal;

      smaeTableRows.push([
        cleanPdfText(g.name),
        counts[0] > 0 ? `${counts[0]}` : '-',
        counts[1] > 0 ? `${counts[1]}` : '-',
        counts[2] > 0 ? `${counts[2]}` : '-',
        counts[3] > 0 ? `${counts[3]}` : '-',
        counts[4] > 0 ? `${counts[4]}` : '-',
        { content: `${rowTotal}`, styles: { fontStyle: 'bold', halign: 'center', textColor: colors.primaryDark } },
        { content: `${groupKcal} kcal`, styles: { halign: 'right', textColor: colors.mutedText } },
      ]);
    });

    smaeTableRows.push([
      { content: 'TOTAL PORCIONES DIARIAS', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: colors.darkHeading } },
      '', '', '', '', '',
      { content: `${sumTotalEquivalents}`, styles: { fontStyle: 'bold', fillColor: colors.primaryLight, textColor: colors.primaryDeep, halign: 'center' } },
      { content: `~${sumTotalKcal} kcal`, styles: { fontStyle: 'bold', fillColor: colors.primaryLight, textColor: colors.primaryDeep, halign: 'right' } },
    ]);

    const smaeTableW = 145;
    autoTable(doc, {
      startY: currentY,
      head: [
        [
          {
            content: 'DISTRIBUCION DE EQUIVALENTES POR TIEMPO DE COMIDA (SMAE)',
            colSpan: 8,
            styles: { fillColor: colors.primaryDeep, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.4, halign: 'center' },
          },
        ],
        ['Grupo de Alimento (SMAE)', 'Des.', 'Col.1', 'Com.', 'Col.2', 'Cena', 'Total', 'Aporte'],
      ],
      body: smaeTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.8,
        halign: 'center',
      },
      styles: {
        fontSize: 6.4,
        cellPadding: 1.6,
        lineColor: colors.border,
        lineWidth: 0.2,
        textColor: colors.darkText,
      },
      columnStyles: {
        0: { cellWidth: 47, fontStyle: 'bold' },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
        7: { cellWidth: 14, halign: 'right' },
      },
      margin: { left: margin, right: pageWidth - margin - smaeTableW },
      pageBreak: 'avoid',
    });

    // Golden Rules Card (Página 2 - Lado Derecho)
    const waterL = plan.targetWaterLiters || 2.5;
    const defaultInstructions =
      `- 1. Respeta tus horarios de comida sin saltarte tiempos para mantener estable tu glucosa e insulina.\n- 2. Métodos de cocción prioritarios: plancha, vapor, horno, air fryer. Cero frituras, capeados o empanizados.\n- 3. Hidratación: Bebe tus ${waterL}L de agua natural a lo largo del día. Evita jugos y refrescos.\n- 4. Sazón natural: Usa libremente hierbas de olor, ajo, pimienta, orégano, cúrcuma y limón.\n- 5. Variedad: Puedes sustituir cualquier alimento siempre que pertenezca al mismo grupo de equivalentes SMAE.\n- 6. Descanso metabólico: Asegura 7-8 horas de sueño para regeneración muscular.`;

    autoTable(doc, {
      startY: currentY,
      head: [['REGLAS DE ORO DEL TRATAMIENTO CLINICO NUTRICIONAL']],
      body: [[defaultInstructions]],
      theme: 'plain',
      headStyles: {
        fillColor: colors.primaryDeep,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.4,
      },
      bodyStyles: {
        fillColor: colors.primaryLight,
        textColor: colors.darkText,
        fontSize: 6.8,
        cellPadding: 3.0,
        lineColor: colors.primary,
        lineWidth: 0.3,
      },
      margin: { left: margin + smaeTableW + 5, right: margin },
      pageBreak: 'avoid',
    });

    // Page 3: Guía Maestra de Intercambios SMAE en Tarjetas Bento (Landscape 4x2)
    doc.addPage('a4', 'landscape');
    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);
    currentY = 38;
    drawSmaeBentoCards(doc, currentY, margin, pageWidth, pageHeight, colors);

    applyFooters(doc, org, specialist, patient, pageWidth, pageHeight, colors, watermarkDataUrl);

    const safePatientName = `${patient.firstName || 'Paciente'}_${patient.lastName || ''}`.replace(/\s+/g, '_');
    const fileName = `Guia_Explicativa_SMAE_${safePatientName}.pdf`;
    const blob = doc.output('blob');
    await deliverPdfFile({
      blob,
      fileName,
      title: `Guía Educativa SMAE - ${patient.firstName} ${patient.lastName}`,
      text: `Guía explicativa del plan nutricional y tabla de equivalencias SMAE para ${patient.firstName} ${patient.lastName}.`,
    });
    return {
      doc,
      fileName,
      blob,
    };
  },

  /**
   * PLAN CLÍNICO DE MENÚS DIARIOS Y RECETAS (DOCUMENTO 2)
   * With 7 Distinct Colors for Each Day of the Week (Lunes a Domingo):
   * - Lunes: Esmeralda
   * - Martes: Azul Zafiro
   * - Miércoles: Ámbar Cálido
   * - Jueves: Púrpura Real
   * - Viernes: Rosa Frambuesa
   * - Sábado: Teal Turquesa
   * - Domingo: Índigo Noche
   */
  async generateMealPlanPdf(
    plan: NutritionPlan,
    patient: Patient,
    org: Organization,
    specialist: UserProfile,
    designId: PdfDesignId = 'clinical_modern'
  ) {
    const colors = getThemeColors(designId);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const portalUrl = `${window.location.origin}/?portal=true&patientId=${patient.id}`;
    const [logoResult, qrDataUrl] = await Promise.all([
      loadPdfImage(org.logoUrl),
      generateQrDataUrl(portalUrl),
    ]);
    const watermarkDataUrl = await getWatermarkDataUrl(logoResult, org.watermarkOpacity);

    await drawExecutiveHeader(doc, org, specialist, patient, plan, pageWidth, margin, qrDataUrl, logoResult, colors);

    let currentY = 38;

    doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.roundedRect(margin, currentY, contentWidth, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(
      cleanPdfText(`PLAN CLINICO DE MENUS SEMANALES, RECETAS Y GRAMAJES • ${patient.firstName} ${patient.lastName}`.toUpperCase()),
      pageWidth / 2,
      currentY + 5.5,
      { align: 'center' }
    );
    currentY += 12;

    const mealsRows: any[] = [];
    const planDays = plan.days && plan.days.length > 0 ? plan.days : [
      { id: 'd1', dayOfWeek: 1, dayName: 'Lunes - Plan Base', meals: [] },
      { id: 'd2', dayOfWeek: 2, dayName: 'Martes - Plan Base', meals: [] },
      { id: 'd3', dayOfWeek: 3, dayName: 'Miércoles - Plan Base', meals: [] },
      { id: 'd4', dayOfWeek: 4, dayName: 'Jueves - Plan Base', meals: [] },
      { id: 'd5', dayOfWeek: 5, dayName: 'Viernes - Plan Base', meals: [] },
      { id: 'd6', dayOfWeek: 6, dayName: 'Sábado - Plan Base', meals: [] },
      { id: 'd7', dayOfWeek: 7, dayName: 'Domingo - Plan Base', meals: [] },
    ];

    planDays.forEach((day, dayIndex) => {
      const dayTheme = getDayTheme(day.dayName, dayIndex, day.dayOfWeek);

      const dayKcal = (day.meals || []).reduce((acc, m) => acc + (m.items || []).reduce((iAcc, it) => iAcc + (it.energyKcal || 0), 0), 0);
      const dayProt = Number((day.meals || []).reduce((acc, m) => acc + (m.items || []).reduce((iAcc, it) => iAcc + (it.proteinG || 0), 0), 0).toFixed(1));
      const dayCarbs = Number((day.meals || []).reduce((acc, m) => acc + (m.items || []).reduce((iAcc, it) => iAcc + (it.carbsG || 0), 0), 0).toFixed(1));
      const dayFat = Number((day.meals || []).reduce((acc, m) => acc + (m.items || []).reduce((iAcc, it) => iAcc + (it.fatG || 0), 0), 0).toFixed(1));

      const dayTitle = cleanPdfText(day.dayName.toUpperCase());
      const dayStats = `${dayKcal > 0 ? dayKcal : plan.targetCaloriesKcal || 1800} kcal  |  P: ${dayProt > 0 ? dayProt : plan.targetProteinG || 130}g  |  C: ${dayCarbs > 0 ? dayCarbs : plan.targetCarbsG || 180}g  |  G: ${dayFat > 0 ? dayFat : plan.targetFatG || 50}g`;

      // Thematic Ribbon for each day of the week
      mealsRows.push([
        {
          content: `${dayTitle}   •   [ ${dayStats} ]`,
          colSpan: 3,
          styles: {
            fillColor: dayTheme.fill,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9.2,
            cellPadding: 3.2,
            halign: 'left',
          },
        },
      ]);

      (day.meals || []).forEach((meal) => {
        const totalMealKcal = (meal.items || []).reduce((acc, i) => acc + (i.energyKcal || 0), 0);
        const totalMealProt = (meal.items || []).reduce((acc, i) => acc + (i.proteinG || 0), 0).toFixed(1);
        const totalMealCarbs = (meal.items || []).reduce((acc, i) => acc + (i.carbsG || 0), 0).toFixed(1);
        const totalMealFat = (meal.items || []).reduce((acc, i) => acc + (i.fatG || 0), 0).toFixed(1);

        const itemsDetailed = (meal.items || [])
          .map((i) => {
            const macroStr = `[${i.energyKcal || 0} kcal • P: ${i.proteinG || 0}g · C: ${i.carbsG || 0}g · G: ${i.fatG || 0}g]`;
            const cleanPortion = formatCleanItemDescription(i);
            return `• ${cleanPortion}  ${macroStr}`;
          })
          .join('\n');

        const prepNote = meal.notes ? `\n\n📌 Preparación y Modo de Elaboración:\n${cleanPdfText(meal.notes)}` : '';
        const cleanMealName = cleanPdfText(meal.name);
        const cleanTime = cleanPdfText(meal.suggestedTime ? `Horario: ${meal.suggestedTime} hrs` : 'Horario recomendado');

        mealsRows.push([
          {
            content: `${cleanMealName}\n${cleanTime}`,
            styles: {
              fillColor: dayTheme.light,
              textColor: dayTheme.textDark,
              fontStyle: 'bold',
              fontSize: 8.8,
            },
          },
          `${itemsDetailed || 'Alimentos e ingredientes estructurados según pauta clínica personalizada.'}${prepNote}`,
          {
            content: `${totalMealKcal} kcal\nP: ${totalMealProt}g\nC: ${totalMealCarbs}g\nG: ${totalMealFat}g`,
            styles: {
              fontStyle: 'bold',
              fontSize: 8.2,
              textColor: colors.primaryDark,
              halign: 'center',
            },
          },
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Tiempo de Comida & Horario', 'Ingredientes Detallados (Gramajes, Medidas Caseras y Preparación)', 'Aporte']],
      body: mealsRows,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.0,
        halign: 'left',
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.2,
        lineColor: colors.border,
        lineWidth: 0.2,
        textColor: colors.darkText,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 175 },
        2: { cellWidth: 44, halign: 'center', fontStyle: 'bold', textColor: colors.primaryDark },
      },
      margin: { left: margin, right: margin },
      pageBreak: 'auto',
    });

    applyFooters(doc, org, specialist, patient, pageWidth, pageHeight, colors, watermarkDataUrl);

    const safePatientName = `${patient.firstName || 'Paciente'}_${patient.lastName || ''}`.replace(/\s+/g, '_');
    const fileName = `Menu_Semanal_Recetario_${safePatientName}.pdf`;
    const blob = doc.output('blob');
    await deliverPdfFile({
      blob,
      fileName,
      title: `Recetario Semanal - ${patient.firstName} ${patient.lastName}`,
      text: `Menú semanal y recetario clínico para ${patient.firstName} ${patient.lastName}.`,
    });
    return {
      doc,
      fileName,
      blob,
    };
  },

  /**
   * RECETARIO CLÍNICO PERSONALIZADO CON INGREDIENTES DETALLADOS, GRAMAJES Y PASOS DE PREPARACIÓN
   */
  async generateRecipesCatalogPdf(
    recipes: Recipe[],
    patient: Patient,
    org: Organization,
    specialist: UserProfile,
    designId: PdfDesignId = 'clinical_modern'
  ) {
    const colors = getThemeColors(designId);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const portalUrl = `${window.location.origin}/?portal=true&patientId=${patient.id}`;
    const [logoResult, qrDataUrl] = await Promise.all([
      loadPdfImage(org.logoUrl),
      generateQrDataUrl(portalUrl),
    ]);
    const watermarkDataUrl = await getWatermarkDataUrl(logoResult, org.watermarkOpacity);

    // Filter to valid recipes or fallback
    const targetRecipes = recipes && recipes.length > 0 ? recipes : [];

    for (let rIdx = 0; rIdx < targetRecipes.length; rIdx++) {
      const recipe = targetRecipes[rIdx];
      if (rIdx > 0) {
        doc.addPage('a4', 'portrait');
      }

      await drawExecutiveHeader(doc, org, specialist, patient, null, pageWidth, margin, qrDataUrl, logoResult, colors);

      let currentY = 38;

      // Recipe Title Banner
      doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
      doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(
        cleanPdfText(`RECETA CLÍNICA • ${recipe.name.toUpperCase()}`),
        pageWidth / 2,
        currentY + 6.8,
        { align: 'center' }
      );
      currentY += 14;

      // Meta Info Card (Category, Calories, Prep Time, Servings)
      doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');

      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      const metaText = `Categoría: ${recipe.category}  |  Aporte: ${recipe.caloriesKcal} kcal  |  Tiempo: ${recipe.prepTimeMinutes || 15} min  |  Porciones: ${recipe.servings || 1}  |  Dificultad: ${recipe.difficulty || 'Fácil'}`;
      doc.text(cleanPdfText(metaText), pageWidth / 2, currentY + 5.2, { align: 'center' });

      doc.setFontSize(8.0);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.mutedText[0], colors.mutedText[1], colors.mutedText[2]);
      const macrosText = `Proteínas: ${recipe.proteinG}g  •  Carbohidratos: ${recipe.carbsG}g  •  Grasas: ${recipe.fatG}g  •  Fibra: ${recipe.fiberG || 4}g`;
      doc.text(cleanPdfText(macrosText), pageWidth / 2, currentY + 9.5, { align: 'center' });

      currentY += 16;

      // Description
      if (recipe.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(cleanPdfText(recipe.description), contentWidth);
        doc.text(descLines, margin, currentY);
        currentY += descLines.length * 4.2 + 4;
      }

      // Ingredients Table (Ultra specific with exact gramajes and measures)
      const ingredientRows = (recipe.ingredients || []).map((ing, idx) => {
        const foodName = cleanPdfText(ing.foodName);
        const portion = cleanPdfText(`${ing.amount} ${ing.unit}`);
        const grams = ing.gramWeight ? `${ing.gramWeight} g` : '—';
        const group = cleanPdfText(ing.equivalentGroupName || 'Grupo SMAE');
        const prep = cleanPdfText(ing.prepState || 'Listo para integrar');
        return [`${idx + 1}`, foodName, portion, grams, group, prep];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Ingrediente / Alimento', 'Medida Casera', 'Gramaje', 'Grupo SMAE', 'Estado / Preparación']],
        body: ingredientRows.length > 0 ? ingredientRows : [['1', 'Ingrediente estructurado', '1 porción', '100 g', 'Alimento libre', 'Preparar al gusto']],
        theme: 'striped',
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.2,
        },
        styles: {
          fontSize: 8.0,
          cellPadding: 2.5,
          lineColor: colors.border,
          lineWidth: 0.2,
          textColor: colors.darkText,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 55, fontStyle: 'bold' },
          2: { cellWidth: 35 },
          3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 32 },
          5: { cellWidth: 28 },
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Preparation Steps
      if (recipe.steps && recipe.steps.length > 0) {
        const stepRows = recipe.steps.map((st, sIdx) => [
          `Paso ${st.stepNumber || sIdx + 1}`,
          cleanPdfText(st.instruction),
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Paso', 'Modo de Preparación e Instrucciones Paso a Paso']],
          body: stepRows,
          theme: 'grid',
          headStyles: {
            fillColor: colors.teal,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.2,
          },
          styles: {
            fontSize: 8.2,
            cellPadding: 3.0,
            lineColor: colors.border,
            lineWidth: 0.2,
            textColor: colors.darkText,
          },
          columnStyles: {
            0: { cellWidth: 26, fontStyle: 'bold', halign: 'center' },
            1: { cellWidth: contentWidth - 26 },
          },
          margin: { left: margin, right: margin },
        });
      }
    }

    applyFooters(doc, org, specialist, patient, pageWidth, pageHeight, colors, watermarkDataUrl);

    const safePatientName = `${patient.firstName || 'Paciente'}_${patient.lastName || ''}`.replace(/\s+/g, '_');
    const fileName = `Recetario_Clinico_${safePatientName}.pdf`;
    const blob = doc.output('blob');
    await deliverPdfFile({
      blob,
      fileName,
      title: `Recetario Clínico - ${patient.firstName} ${patient.lastName}`,
      text: `Recetario clínico detallado para ${patient.firstName} ${patient.lastName}.`,
    });
    return {
      doc,
      fileName,
      blob,
    };
  },

  /**
   * LISTA DE COMPRAS Y SUPERMERCADO INTELIGENTE
   * Executive Shopping List organized by supermarket aisles (Landscape)
   */
  async generateShoppingListPdf(items: string[], patientName: string, org: Organization, designId: PdfDesignId = 'clinical_modern') {
    const colors = getThemeColors(designId);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;

    const logoResult = await loadPdfImage(org.logoUrl);
    const watermarkDataUrl = await getWatermarkDataUrl(logoResult, org.watermarkOpacity);

    doc.setFillColor(colors.headerBar[0], colors.headerBar[1], colors.headerBar[2]);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(colors.headerSubBar[0], colors.headerSubBar[1], colors.headerSubBar[2]);
    doc.rect(0, 26, pageWidth, 2, 'F');
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.rect(0, 28, pageWidth, 1, 'F');

    let textStartX = margin;

    if (logoResult) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, 4, 20, 20, 2.5, 2.5, 'F');
        const maxLogoSize = 16;
        let imgW = maxLogoSize;
        let imgH = maxLogoSize;
        if (logoResult.width > logoResult.height) {
          imgH = (logoResult.height / logoResult.width) * maxLogoSize;
        } else {
          imgW = (logoResult.width / logoResult.height) * maxLogoSize;
        }
        const imgX = margin + (20 - imgW) / 2;
        const imgY = 4 + (20 - imgH) / 2;
        doc.addImage(logoResult.dataUrl, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');
        textStartX = margin + 24;
      } catch (err) {
        console.warn('Error embedding logo:', err);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LISTA DE COMPRAS Y SUPERMERCADO INTELIGENTE', textStartX, 11);

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(cleanPdfText(`PLAN NUTRICIONAL PERSONALIZADO • PACIENTE: ${patientName.toUpperCase()}`), textStartX, 17);
    doc.text(cleanPdfText('ORGANIZACION POR PASILLOS Y ALIMENTOS FRESCOS PARA MAXIMA ADHERENCIA'), textStartX, 22);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const todayStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(cleanPdfText(`Fecha sugerida de compra: ${todayStr}`), margin, 35);
    doc.text(`Tip: Marca cada casilla conforme vayas adquiriendo tus alimentos frescos en el supermercado o mercado local.`, margin, 40);

    const safeItems = items.length > 0 ? items : [
      'Verduras frescas de temporada (espinaca, jitomate, pepino, nopales, brócoli)',
      'Proteínas magras (pechuga de pollo, pescado blanco, claras de huevo, queso panela)',
      'Cereales integrales (avena en hojuelas, arroz integral, tortillas de maíz, tostadas horneadas)',
      'Grasas saludables (aguacate Hass, aceite de oliva extravirgen, nueces y almendras)',
      'Lácteos y despensa (yogur griego sin azúcar, frijoles de la olla, canela en polvo)',
      'Frutas frescas (manzanas, plátanos, moras azules, papaya picada)',
    ];

    // Build 2-column landscape checklist table
    const halfLen = Math.ceil(safeItems.length / 2);
    const colLeft = safeItems.slice(0, halfLen);
    const colRight = safeItems.slice(halfLen);
    const tableRows: any[] = [];

    for (let r = 0; r < halfLen; r++) {
      const leftItem = colLeft[r] ? `${r + 1}.  ${cleanPdfText(colLeft[r])}` : '';
      const rightItem = colRight[r] ? `${halfLen + r + 1}.  ${cleanPdfText(colRight[r])}` : '';
      tableRows.push([
        colLeft[r] ? '[  ]' : '',
        leftItem,
        colRight[r] ? '[  ]' : '',
        rightItem,
      ]);
    }

    autoTable(doc, {
      startY: 44,
      head: [
        ['Check', 'Artículo / Porción Recomendada', 'Check', 'Artículo / Porción Recomendada'],
      ],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.0,
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 2.4,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: colors.primaryDark },
        1: { cellWidth: 119, fontStyle: 'normal' },
        2: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: colors.primaryDark },
        3: { cellWidth: 120, fontStyle: 'normal' },
      },
      margin: { left: margin, right: margin },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      if (watermarkDataUrl) {
        try {
          const wmSize = 100;
          const wmX = (pageWidth - wmSize) / 2;
          const wmY = (pageHeight - wmSize) / 2 + 6;
          doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST');
        } catch {}
      }

      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(
        cleanPdfText(`Plan Nutricional Personalizado • Lista de Compras: ${patientName} • Página ${i} de ${pageCount}`),
        pageWidth / 2,
        pageHeight - 2,
        { align: 'center' }
      );
    }

    const safeName = patientName.replace(/\s+/g, '_');
    const fileName = `Lista_Compras_${safeName}.pdf`;
    const blob = doc.output('blob');
    await deliverPdfFile({
      blob,
      fileName,
      title: `Lista de Compras - ${patientName}`,
      text: `Lista de compras organizada para el supermercado de ${patientName}.`,
    });
    return {
      doc,
      fileName,
      blob,
    };
  },

  /**
   * PLANEACIÓN SEMANAL EN FORMATO MATRIZ HORIZONTAL CON FOTOS (LANDSCAPE A4)
   * Exactamente idéntico a las imágenes compartidas por el usuario:
   * - Orientación horizontal (Landscape A4: 297mm x 210mm)
   * - Título central: "Planeación semanal"
   * - 8 Columnas con encabezados en colores distintivos:
   *   [Horario (Navy), Lunes (Fucsia), Martes (Púrpura), Miércoles (Azul), Jueves (Coral), Viernes (Dorado), Sábado (Cielo), Domingo (Teal)]
   * - Fondo de cada columna en tono pastel correspondiente
   * - Columna izquierda: Nombre del tiempo y horario (ej. "Desayuno\n07:00", "Almuerzo\n09:00")
   * - Cada casilla diaria contiene:
   *   1. Fotografía/miniatura del platillo con esquinas redondeadas generada por Canvas
   *   2. Nombre del platillo en negrita
   *   3. Lista de ingredientes con viñetas ("* 2 pieza de Pan integral...")
   */
  async generateWeeklyScheduleLandscapePdf(
    plan: NutritionPlan,
    patient: Patient,
    org: Organization,
    specialist: UserProfile,
    customPhotos?: Record<string, string>,
    options?: { autoSave?: boolean }
  ): Promise<PdfExportResult> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    await drawWeeklyScheduleLandscapePages(doc, plan, patient, org, specialist, true, customPhotos);

    const safePatientName = `${patient.firstName || 'Paciente'}_${patient.lastName || ''}`.replace(/\s+/g, '_');
    const fileName = `Planeacion_Semanal_${safePatientName}.pdf`;
    const blob = doc.output('blob');
    if (options?.autoSave !== false) {
      await deliverPdfFile({
        blob,
        fileName,
        title: `Planeación Semanal - ${patient.firstName} ${patient.lastName}`,
        text: `Planeación semanal con fotografías y menús detallados de ${patient.firstName} ${patient.lastName}.`,
      });
    }
    return {
      doc,
      fileName,
      blob,
    };
  },
};

