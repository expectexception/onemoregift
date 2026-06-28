"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, ImagePlus } from "lucide-react";
import api from "@/app/utils/apiClient";
import { compressImage } from "@/app/utils/imageCompressor";
import { useToast } from "@/hooks/use-toast";

// Drag/drop + click multi-image uploader used in admin Products/Gifts forms.
// Compresses client-side before sending to POST /upload/multiple (admin-only,
// up to 10 files/request), then reports back the resulting URL array.
export default function MultiImageUploader({ images = [], onChange, max = 8 }) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const handleFiles = async (fileList) => {
        const files = Array.from(fileList).slice(0, Math.max(0, max - images.length));
        if (!files.length) return;

        setUploading(true);
        setProgress(0);
        try {
            const compressed = await Promise.all(files.map((f) => compressImage(f)));
            const form = new FormData();
            compressed.forEach((f) => form.append("images", f));

            const { data } = await api.post("upload/multiple", form, {
                meta: { auth: "admin" },
                onUploadProgress: (evt) => {
                    setProgress(Math.round((evt.loaded * 100) / evt.total));
                },
            });

            if (!data.error) {
                onChange([...images, ...data.urls]);
            } else {
                toast({ title: "Upload failed", description: data.msg, variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Upload failed", description: err?.response?.data?.msg || "Could not upload images.", variant: "destructive" });
        }
        setUploading(false);
        setProgress(0);
    };

    const removeImage = (idx) => {
        onChange(images.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-3">
            {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {images.map((url, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {images.length < max && (
                <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        dragOver ? "border-red-500/60 bg-red-500/5" : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03]"
                    }`}
                >
                    <div className="flex flex-col items-center gap-1">
                        {uploading ? (
                            <UploadCloud className="w-5 h-5 text-red-400 animate-bounce" />
                        ) : (
                            <ImagePlus className="w-5 h-5 text-neutral-500" />
                        )}
                        <p className="text-[11px] text-neutral-400">
                            {uploading ? `Uploading... ${progress}%` : "Drag & drop or click to upload images"}
                        </p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
                    />
                </label>
            )}

            {uploading && (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}
