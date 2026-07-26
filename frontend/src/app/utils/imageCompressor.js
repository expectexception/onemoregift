export const compressImage = (
    file,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    maxBytes = 1.5 * 1024 * 1024
) => {
    return new Promise((resolve) => {
        if (!file) {
            resolve(null);
            return;
        }
        if (!file.type.startsWith("image/")) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const exportBlob = (q, w, h) => {
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }
                            if (blob.size <= maxBytes || (w <= 640 && h <= 640)) {
                                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                                return;
                            }
                            const nextW = Math.max(640, Math.floor(w * 0.9));
                            const nextH = Math.max(640, Math.floor(h * 0.9));
                            const nextQ = Math.max(0.6, q - 0.05);
                            exportBlob(nextQ, nextW, nextH);
                        },
                        "image/jpeg",
                        q
                    );
                };
                exportBlob(quality, width, height);
            };
            img.onerror = () => resolve(file);
            img.src = event.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};
