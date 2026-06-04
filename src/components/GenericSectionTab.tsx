import { useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { aspectStyle, objectStyle } from "@/config/cardLayouts";
import { useCardLayoutById } from "@/hooks/useCardLayouts";
import { useGenericSection } from "@/hooks/useGenericSection";
import {
  entityName,
  fieldLabel,
  fieldValue,
  firstFieldBySlot,
  typeFields,
  type EntityRow,
} from "@/config/genericEntities";
import { componentImageUrl } from "@/lib/storage";
import type { ComponentMediaTable } from "@/config/mediaFolders";
import { useLang } from "@/context/LanguageContext";
import H3MasterSpinner from "@/components/H3MasterSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  tabId: string;
  labelEN: string;
  labelRU: string;
}

export default function GenericSectionTab({ tabId, labelEN, labelRU }: Props) {
  const { lang } = useLang();
  const { data, isLoading } = useGenericSection(tabId);
  const layout = useCardLayoutById(data?.entityType?.layout_ref);
  const [openEntity, setOpenEntity] = useState<EntityRow | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <H3MasterSpinner size={48} variant="draw" className="text-primary" />
      </div>
    );
  }

  if (!data?.entityType) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            {lang === "RU" ? labelRU : labelEN}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === "RU"
              ? "Этот раздел пока не имеет настроенного типа контента. Тип контента подключается на этапе Section 6."
              : "This section does not have a content type configured yet. Content types are wired up in Section 6."}
          </p>
        </div>
      </div>
    );
  }

  const et = data.entityType;
  const badgeField = firstFieldBySlot(et, "badge");
  const detailFields = typeFields(et);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <CardGrid layout={layout}>
        {data.entities.map((e) => {
          const badge = badgeField ? fieldValue(e, badgeField, lang) : "";
          const imgSrc = e.image
            ? componentImageUrl(e.type_key as ComponentMediaTable, e.image)
            : null;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setOpenEntity(e)}
              className="text-left group"
            >
              <div
                className="relative bg-muted rounded-md overflow-hidden"
                style={aspectStyle(layout)}
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={entityName(e, lang)}
                    loading="lazy"
                    className="w-full h-full"
                    style={objectStyle(layout)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
                    {entityName(e, lang).charAt(0)}
                  </div>
                )}
                {badge ? (
                  <Badge className="absolute top-1 left-1">{badge}</Badge>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-foreground line-clamp-2">
                {entityName(e, lang)}
              </div>
            </button>
          );
        })}
      </CardGrid>

      <Dialog
        open={openEntity != null}
        onOpenChange={(o) => {
          if (!o) setOpenEntity(null);
        }}
      >
        <DialogContent>
          {openEntity ? (
            <>
              <DialogHeader>
                <DialogTitle>{entityName(openEntity, lang)}</DialogTitle>
                <DialogDescription>
                  {lang === "RU" ? et.label_ru : et.label_en}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {detailFields.map((f) => {
                  const v = fieldValue(openEntity, f, lang);
                  if (!v) return null;
                  return (
                    <div key={f.key}>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {fieldLabel(f, lang)}
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {v}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
