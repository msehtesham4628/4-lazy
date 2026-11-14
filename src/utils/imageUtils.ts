/**
 * Client-side image compression and resizing utility.
 * Downscales multi-megabyte uploads (e.g. 10MB-50MB camera/PNG files)
 * into compact Web-optimized data URLs well within API & database payload limits.
 */
function hasTransparentPixels(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const sampleW = Math.min(width, 64);
    const sampleH = Math.min(height, 64);
    const stepX = Math.max(1, Math.floor(width / sampleW));
    const stepY = Math.max(1, Math.floor(height / sampleH));
    const imgData = ctx.getImageData(0, 0, width, height).data;
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const alpha = imgData[(y * width + x) * 4 + 3];
        if (alpha < 250) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const base64Len = dataUrl.length - commaIdx - 1;
  return Math.floor((base64Len * 3) / 4);
}

export async function compressUploadImage(
  file: File,
  maxDimension = 900,
  quality = 0.8,
  maxTargetBytes = 140 * 1024
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const encodeAttempt = (w: number, h: number, q: number): string => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          if (!ctx) return e.target?.result as string;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const isPng = file.type === 'image/png';
          const transparent = isPng && hasTransparentPixels(ctx, canvas.width, canvas.height);

          if (transparent) {
            // Try WebP first (supports alpha + lossy compression); fall back to JPEG on white if WebP unsupported
            const webpUrl = canvas.toDataURL('image/webp', q);
            if (webpUrl.startsWith('data:image/webp')) {
              return webpUrl;
            }
          }

          // Try WebP for smallest size, fall back to JPEG
          const webpAttempt = canvas.toDataURL('image/webp', q);
          if (webpAttempt.startsWith('data:image/webp')) {
            return webpAttempt;
          }
          return canvas.toDataURL('image/jpeg', q);
        };

        let curW = width;
        let curH = height;
        let curQ = quality;
        let result = encodeAttempt(curW, curH, curQ);

        // Iteratively compress until under maxTargetBytes (or minimum bounds)
        const qualitySteps = [0.7, 0.58, 0.46];
        for (const qStep of qualitySteps) {
          if (estimateDataUrlBytes(result) <= maxTargetBytes) break;
          curQ = Math.min(curQ, qStep);
          result = encodeAttempt(curW, curH, curQ);
        }

        let scaleTries = 0;
        while (estimateDataUrlBytes(result) > maxTargetBytes && scaleTries < 3 && Math.max(curW, curH) > 360) {
          curW = Math.round(curW * 0.78);
          curH = Math.round(curH * 0.78);
          result = encodeAttempt(curW, curH, Math.min(curQ, 0.55));
          scaleTries++;
        }

        resolve(result);
      };

      img.onerror = () => {
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
