/**
 * Client-side image compression and downscaling utility.
 * Downscales smartphone photos from 10MB-20MB down to ~300KB (max 1600px, 0.85 quality),
 * which speeds up upload and AI OCR processing by 10x-50x while preserving formula clarity.
 */
export async function compressImage(
  source: File | string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ dataUrl: string; mimeType: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while keeping aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original
        if (typeof source === 'string') {
          return resolve({ dataUrl: source, mimeType: 'image/jpeg', sizeKb: Math.round(source.length / 1024) });
        }
        return reject(new Error('Canvas context not available'));
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

      resolve({ dataUrl, mimeType, sizeKb });
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for compression:', err);
      if (typeof source === 'string') {
        resolve({ dataUrl: source, mimeType: 'image/jpeg', sizeKb: 0 });
      } else {
        reject(new Error('无法读取图片，请检查图片格式'));
      }
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
