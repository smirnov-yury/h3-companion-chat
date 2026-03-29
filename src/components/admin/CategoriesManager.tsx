import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  key: string;
  label_ru: string;
  label_en: string;
  image_url: string | null;
  sort_order: number | null;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const handleUpload = async (key: string, file: File) => {
    if (file.size > 300 * 1024) {
      setError("Максимальный размер файла — 300 КБ");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setUploading(key);
    const ext = file.name.split(".").pop() || "webp";
    const path = `${key}.${ext}`;

    await supabase.storage.from("category-images").remove([path]);

    const { error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      setError("Ошибка загрузки");
      setTimeout(() => setError(null), 3000);
      setUploading(null);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("category-images").getPublicUrl(path);

    await supabase
      .from("categories")
      .update({ image_url: publicUrl })
      .eq("key", key);

    setCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, image_url: publicUrl } : c))
    );
    setUploading(null);
  };

  const handleRemove = async (key: string) => {
    // Try removing common extensions
    const paths = [`${key}.webp`, `${key}.jpg`, `${key}.jpeg`, `${key}.png`];
    await supabase.storage.from("category-images").remove(paths);
    await supabase
      .from("categories")
      .update({ image_url: null })
      .eq("key", key);
    setCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, image_url: null } : c))
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-sm font-medium text-foreground mb-4">
        Управление категориями — обложки
      </h2>
      {error && (
        <p className="text-destructive text-xs mb-3 px-1">{error}</p>
      )}
      {categories.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">
          Нет категорий
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.key}
            category={cat}
            uploading={uploading === cat.key}
            onUpload={(file) => handleUpload(cat.key, file)}
            onRemove={() => handleRemove(cat.key)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  uploading,
  onUpload,
  onRemove,
}: {
  category: Category;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.label_en}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-medium text-card-foreground">
            {category.label_ru}
          </p>
          <p className="text-xs text-muted-foreground">{category.label_en}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-3 h-3 mr-1" />
            {uploading
              ? "Загрузка..."
              : category.image_url
                ? "Заменить"
                : "Загрузить"}
          </Button>
          {category.image_url && (
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={onRemove}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
