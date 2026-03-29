import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Upload, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EditItemModalProps {
  open: boolean;
  onClose: () => void;
  item: {
    id: string;
    title_en: string;
    title_ru: string;
    body_en: string;
    body_ru: string;
    category: string;
    type?: string;
    media_url?: string | null;
  } | null;
  categories: { key: string; label: string }[];
  showTypeField?: boolean;
  componentTypes?: { key: string; label_ru: string; label_en: string }[];
  onSave: (data: {
    title_en: string;
    title_ru: string;
    body_en: string;
    body_ru: string;
    category: string;
    type?: string;
    media_url?: string | null;
  }) => Promise<void>;
}

export default function EditItemModal({
  open,
  onClose,
  item,
  categories,
  showTypeField,
  componentTypes = [],
  onSave,
}: EditItemModalProps) {
  const [titleEn, setTitleEn] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyRu, setBodyRu] = useState("");
  const [category, setCategory] = useState("");
  const [itemType, setItemType] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setTitleEn(item.title_en);
      setTitleRu(item.title_ru);
      setBodyEn(item.body_en);
      setBodyRu(item.body_ru);
      setCategory(item.category);
      setItemType(item.type || "other");
      setMediaUrl(item.media_url || null);
      setSaved(false);
    }
  }, [item]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${item.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("component-media")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        alert("Upload failed: " + uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("component-media")
        .getPublicUrl(path);
      setMediaUrl(urlData.publicUrl);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteMedia = () => {
    setMediaUrl(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title_en: titleEn,
        title_ru: titleRu,
        body_en: bodyEn,
        body_ru: bodyRu,
        category,
        type: itemType,
        media_url: mediaUrl,
      });
      setSaved(true);
      setTimeout(() => onClose(), 800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Title (EN)</Label>
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Title (RU)</Label>
            <Input value={titleRu} onChange={(e) => setTitleRu(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Body (EN)</Label>
            <Textarea
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Body (RU)</Label>
            <Textarea
              value={bodyRu}
              onChange={(e) => setBodyRu(e.target.value)}
              rows={4}
            />
          </div>

          {/* Media upload section */}
          {showTypeField && (
            <div className="space-y-2">
              <Label className="text-xs">Медиа / Media</Label>
              {mediaUrl && (
                <div className="relative inline-block">
                  <img
                    src={mediaUrl}
                    alt="Component media"
                    className="max-h-[200px] rounded-md border border-border object-contain"
                  />
                  <button
                    onClick={handleDeleteMedia}
                    className="absolute top-1 right-1 p-1 rounded bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {uploading ? "Загрузка..." : "Загрузить / Upload"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Одинаково для RU и EN / Same for both languages
              </p>
            </div>
          )}

          {showTypeField && (
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {componentTypes.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.key} — {t.label_ru} / {t.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {categories.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || saved}>
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-1" /> Saved
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
