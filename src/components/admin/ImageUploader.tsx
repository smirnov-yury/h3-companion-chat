import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Check, Loader2 } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;
const MAX_PX = 600;
const WEBP_QUALITY = 0.88;

interface ImageUploaderProps {
  table: string;
  recordId: string;
  folder: string;
  imageField: string;
  currentImage: string | null;
  onUploaded?: () => void;
}

async function toWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/webp",
        WEBP_QUALITY,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ImageUploader({
  table,
  recordId,
  folder,
  imageField,
  currentImage,
  onUploaded,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setStatus("idle");
    try {
      const webp = await toWebp(file);
      setBlob(webp);
      setPreview(URL.createObjectURL(webp));
    } catch {
      setError("Failed to process image");
    }
  };

  const handleUpload = async () => {
    if (!blob) return;
    setStatus("uploading");
    setError(null);
    const filename = `${recordId}.webp`;
    const path = `${folder}/${filename}`;

    const { error: storageErr } = await supabase.storage
      .from("component-media")
      .upload(path, blob, { upsert: true, contentType: "image/webp" });

    if (storageErr) {
      setError(storageErr.message);
      setStatus("error");
      return;
    }

    const { error: dbErr } = await supabase
      .from(table as any)
      .update({ [imageField]: filename, image_status: "uploaded" })
      .eq("id", recordId);

    if (dbErr) {
      setError(dbErr.message);
      setStatus("error");
      return;
    }

    setStatus("done");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBlob(null);
    onUploaded?.();
  };

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBlob(null);
    setStatus("idle");
    setError(null);
  };

  const imageUrl = currentImage ? `${STORAGE_BASE}/${folder}/${currentImage}` : null;

  return (
    <div className="flex flex-col gap-2 w-32">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div
        className="relative w-32 h-32 rounded-lg border border-border bg-muted/30 overflow-hidden cursor-pointer hover:border-primary transition-colors flex items-center justify-center"
        onClick={() => inputRef.current?.click()}
        title="Click to select image"
      >
        {preview || imageUrl ? (
          <img
            src={preview ?? imageUrl ?? ""}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
        {status === "done" && !preview && (
          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>

      {preview && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleUpload}
            disabled={status === "uploading"}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {status === "uploading" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={status === "uploading"}
            className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-muted text-foreground text-xs hover:bg-muted/80 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {!preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-muted-foreground hover:text-foreground text-center"
        >
          {currentImage ? "Change image" : "Upload image"}
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
