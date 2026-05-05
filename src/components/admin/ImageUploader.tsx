import { useCallback, useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Check, Loader2, Trash2 } from "lucide-react";

import { SUPABASE_URL } from "@/integrations/supabase/client";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/component-media`;
const MAX_PX = 800;
const WEBP_QUALITY = 0.88;

type CropPreset = "card" | "portrait" | "landscape" | "free";

const PRESETS: { key: CropPreset; label: string; aspect: number | undefined }[] = [
  { key: "card", label: "Card 5:7", aspect: 5 / 7 },
  { key: "portrait", label: "Portrait 1:1", aspect: 1 },
  { key: "landscape", label: "Landscape 4:3", aspect: 4 / 3 },
  { key: "free", label: "Free", aspect: undefined },
];

function folderToPreset(folder: string): CropPreset {
  if (folder === "heroes") return "portrait";
  if (folder === "events" || folder === "astrologers_proclaim" || folder === "fields") return "landscape";
  if (folder === "towns") return "free";
  return "card";
}

function centerAspectCrop(width: number, height: number, aspect: number | undefined): Crop {
  if (!aspect) {
    return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
    width,
    height,
  );
}

async function cropToWebp(
  img: HTMLImageElement,
  pixelCrop: PixelCrop,
  rotation: number,
): Promise<Blob> {
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;

  const nx = pixelCrop.x * scaleX;
  const ny = pixelCrop.y * scaleY;
  const nw = pixelCrop.width * scaleX;
  const nh = pixelCrop.height * scaleY;

  const scale = Math.min(1, MAX_PX / Math.max(nw, nh));
  const outW = Math.round(nw * scale);
  const outH = Math.round(nh * scale);

  const rotCanvas = document.createElement("canvas");
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  rotCanvas.width = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
  rotCanvas.height = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);
  const rotCtx = rotCanvas.getContext("2d")!;
  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const offsetX = (rotCanvas.width - img.naturalWidth) / 2;
  const offsetY = (rotCanvas.height - img.naturalHeight) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    rotCanvas,
    nx + offsetX,
    ny + offsetY,
    nw,
    nh,
    0,
    0,
    outW,
    outH,
  );

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/webp",
      WEBP_QUALITY,
    ),
  );
}

interface ImageUploaderProps {
  table: string;
  recordId: string;
  folder: string;
  imageField: string;
  currentImage: string | null;
  defaultCropPreset?: CropPreset;
  hasImageStatus?: boolean;
  onUploaded?: () => void;
  onDeleted?: () => void;
}

export default function ImageUploader({
  table,
  recordId,
  folder,
  imageField,
  currentImage,
  defaultCropPreset,
  hasImageStatus = true,
  onUploaded,
  onDeleted,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [preset, setPreset] = useState<CropPreset>(
    defaultCropPreset ?? folderToPreset(folder),
  );
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 90, height: 90 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setRawSrc(url);
    setPreset(defaultCropPreset ?? folderToPreset(folder));
    setCompletedCrop(null);
    setRotation(0);
    setZoom(1);
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const currentPreset = PRESETS.find((p) => p.key === preset);
      setCrop(centerAspectCrop(width, height, currentPreset?.aspect));
    },
    [preset],
  );

  const handlePresetChange = (key: CropPreset) => {
    setPreset(key);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const p = PRESETS.find((pr) => pr.key === key);
      setCrop(centerAspectCrop(width, height, p?.aspect));
      setCompletedCrop(null);
    }
  };

  const handleCropConfirm = async () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    let pixelCrop: PixelCrop;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      pixelCrop = completedCrop;
    } else {
      const pct = crop.unit === "%";
      pixelCrop = {
        unit: "px",
        x: pct ? (crop.x / 100) * img.width : crop.x,
        y: pct ? (crop.y / 100) * img.height : crop.y,
        width: pct ? (crop.width / 100) * img.width : crop.width,
        height: pct ? (crop.height / 100) * img.height : crop.height,
      };
    }
    try {
      const webpBlob = await cropToWebp(img, pixelCrop, rotation);
      if (preview) URL.revokeObjectURL(preview);
      if (rawSrc) URL.revokeObjectURL(rawSrc);
      setBlob(webpBlob);
      setPreview(URL.createObjectURL(webpBlob));
      setRawSrc(null);
      setStatus("idle");
      setError(null);
    } catch {
      setError("Failed to process image");
    }
  };

  const handleCropCancel = () => {
    if (rawSrc) URL.revokeObjectURL(rawSrc);
    setRawSrc(null);
    setRotation(0);
    setZoom(1);
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
    const updatePayload = hasImageStatus
      ? { [imageField]: filename, image_status: "uploaded" }
      : { [imageField]: filename };
    const { error: dbErr } = await supabase
      .from(table as never)
      .update(updatePayload as never)
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

  const handleDelete = async () => {
    if (!currentImage) return;
    setDeleting(true);
    setError(null);
    const path = `${folder}/${currentImage}`;
    const { error: storageErr } = await supabase.storage
      .from("component-media")
      .remove([path]);
    if (storageErr) { setError(storageErr.message); setDeleting(false); return; }
    const { error: dbErr } = await supabase
      .from(table as never)
      .update({ [imageField]: null } as never)
      .eq("id", recordId);
    if (dbErr) { setError(dbErr.message); setDeleting(false); return; }
    setDeleting(false);
    onDeleted?.();
  };

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBlob(null);
    setStatus("idle");
    setError(null);
  };

  const imageUrl = currentImage ? `${STORAGE_BASE}/${folder}/${currentImage}` : null;
  const currentPresetAspect = PRESETS.find((p) => p.key === preset)?.aspect;

  return (
    <>
      {rawSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg p-4 max-w-4xl w-full max-h-[90vh] flex flex-col gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Crop preset</p>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePresetChange(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      preset === p.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Rotation</span>
              <button
                type="button"
                onClick={() => setRotation((r) => Math.max(-180, r - 90))}
                className="px-2 py-1 rounded border border-border text-xs text-foreground hover:bg-accent"
                title="Rotate -90°"
              >
                -90°
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => Math.max(-180, r - 1))}
                className="px-2 py-1 rounded border border-border text-xs text-foreground hover:bg-accent"
                title="Rotate left 1°"
              >
                ◀
              </button>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <button
                type="button"
                onClick={() => setRotation((r) => Math.min(180, r + 1))}
                className="px-2 py-1 rounded border border-border text-xs text-foreground hover:bg-accent"
                title="Rotate right 1°"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => Math.min(180, r + 90))}
                className="px-2 py-1 rounded border border-border text-xs text-foreground hover:bg-accent"
                title="Rotate +90°"
              >
                +90°
              </button>
              <button
                type="button"
                onClick={() => setRotation(0)}
                className="px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:bg-accent"
                title="Reset rotation"
              >
                Reset
              </button>
              <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                {rotation}°
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">Zoom</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, parseFloat((z - 0.25).toFixed(2))))}
                className="px-2 py-1 rounded border border-border text-xs text-foreground hover:bg-accent"
                title="Zoom out"
              >
                −
              </button>
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))))}
                className="px-2 py-1 rounded border border-border text-xs text-foreground hover:bg-accent"
                title="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="px-2 py-1 rounded border border-border text-xs text-muted-foreground hover:bg-accent"
                title="Reset zoom"
              >
                Reset
              </button>
              <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                {zoom.toFixed(1)}×
              </span>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg p-2">
              <div className="overflow-auto max-h-[65vh] rounded border border-border">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={currentPresetAspect}
                  minWidth={20}
                  minHeight={20}
                >
                  <img
                    ref={imgRef}
                    src={rawSrc}
                    onLoad={onImageLoad}
                    alt=""
                    style={{
                      width: `${zoom * 100}%`,
                      maxWidth: `${zoom * 100}%`,
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.15s ease",
                      display: "block",
                    }}
                  />
                </ReactCrop>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-3 py-1.5 rounded-lg border border-border text-foreground text-xs hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
              >
                <Check className="w-3 h-3" />
                Use this crop
              </button>
            </div>
          </div>
        </div>
      )}

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
            <img src={preview ?? imageUrl ?? ""} alt="" className="w-full h-full object-cover" />
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
          <div className="flex flex-col gap-1 items-center">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground text-center"
            >
              {currentImage ? "Change image" : "Upload image"}
            </button>
            {currentImage && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            )}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </>
  );
}
