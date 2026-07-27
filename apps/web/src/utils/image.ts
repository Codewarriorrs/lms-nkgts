/**
 * Kompresi gambar client-side sebelum diunggah ke Supabase
 * Menggunakan canvas untuk resize lebar maksimal 1200px dan kualitas JPEG 0.7
 */
export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // Jika bukan file gambar, return file asli
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Ganti ekstensi file menjadi .jpg karena dikompresi ke JPEG
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                const compressedFile = new File([blob], newName, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.7
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        resolve(file);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
};
