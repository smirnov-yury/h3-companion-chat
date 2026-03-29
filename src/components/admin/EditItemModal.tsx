import { useState, useEffect } from "react";
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
import { Check } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (item) {
      setTitleEn(item.title_en);
      setTitleRu(item.title_ru);
      setBodyEn(item.body_en);
      setBodyRu(item.body_ru);
      setCategory(item.category);
      setItemType(item.type || "other");
      setSaved(false);
    }
  }, [item]);

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
          {showTypeField && (
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPONENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
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
