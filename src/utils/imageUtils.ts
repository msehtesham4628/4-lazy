/**
 * Lightweight client-side image compression and resizing utility.
 * Downscales multi-megabyte user uploads (e.g. 10MB+ phone camera captures)
 * to a lightweight ~50-80KB Web-optimized data URL.
 */
export async function compressUploadImage(
  file: File,
  maxDimension = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image or SVG, read as regular data url
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

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Preserve PNG transparency if png, otherwise encode as jpeg to drastically minimize memory
        const isPng = file.type === 'image/png';
        const outputMime = isPng ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(outputMime, isPng ? undefined : quality);

        resolve(compressedDataUrl);
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
