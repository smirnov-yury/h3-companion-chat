import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRules, type Component, type Rule } from "@/context/RulesContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Download,
  HelpCircle,
  LogOut,
  Plus,
  GripVertical,
  Lock,
  Pencil,
  Check,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EditItemModal from "@/components/admin/EditItemModal";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import CategoriesManager from "@/components/admin/CategoriesManager";

/* ─── types ─── */

interface AdminComponent extends Component {
  category_ru: string;
  category_en: string;
  subcategory_ru: string;
  subcategory_en: string;
}

interface AdminRule extends Rule {
  category_ru: string;
  category_en: string;
  subcategory_ru: string;
  subcategory_en: string;
}

interface BiName {
  name_ru: string;
  name_en: string;
}

/* ─── helpers ─── */

const COMP_CAT_MAP: Record<string, BiName> = {
  unit: { name_ru: "Юниты", name_en: "Units" },
  card: { name_ru: "Карты", name_en: "Cards" },
  hero: { name_ru: "Герои", name_en: "Heroes" },
  token: { name_ru: "Жетоны", name_en: "Tokens" },
  icon: { name_ru: "Иконки", name_en: "Icons" },
  schema: { name_ru: "Схемы", name_en: "Schemas" },
  game: { name_ru: "Игровое", name_en: "Game" },
  book: { name_ru: "Книги", name_en: "Books" },
  mission: { name_ru: "Миссии", name_en: "Missions" },
  location: { name_ru: "Локации", name_en: "Locations" },
  rule: { name_ru: "Правила", name_en: "Rules" },
  miss: { name_ru: "Разное", name_en: "Miscellaneous" },
  other: { name_ru: "Прочее", name_en: "Other" },
};

function deriveCatBi(image: string): BiName {
  const m = image.match(/\{img:[^_}]+_([^_}]+)/);
  const raw = m?.[1] ?? "other";
  return COMP_CAT_MAP[raw] ?? COMP_CAT_MAP.other;
}

const FACTION_MAP: Record<string, BiName> = {
  castle: { name_ru: "Замок", name_en: "Castle" },
  tower: { name_ru: "Башня", name_en: "Tower" },
  inferno: { name_ru: "Инферно", name_en: "Inferno" },
  necropolis: { name_ru: "Некрополис", name_en: "Necropolis" },
  rampart: { name_ru: "Оплот", name_en: "Rampart" },
  fortress: { name_ru: "Крепость", name_en: "Fortress" },
  conflux: { name_ru: "Сплетение", name_en: "Conflux" },
  cove: { name_ru: "Причал", name_en: "Cove" },
  tray: { name_ru: "Нейтральные", name_en: "Neutrals" },
  other: { name_ru: "Прочие", name_en: "Other" },
};

function deriveFactionBi(c: Component): BiName {
  const faction = (c as any).faction;
  if (faction && FACTION_MAP[faction]) return FACTION_MAP[faction];
  if (faction) return { name_ru: faction, name_en: faction };
  return { name_ru: "Общее", name_en: "General" };
}

const RULE_CAT_MAP: Record<string, BiName> = {
  alliance:             { name_ru: "Альянс",                    name_en: "Alliance" },
  astrologers:          { name_ru: "Астрологи",                 name_en: "Astrologers" },
  astrologers_proclaim: { name_ru: "Провозглашение астрологов", name_en: "Astrologers' Proclamation" },
  campaign:             { name_ru: "Кампания",                  name_en: "Campaign" },
  campaign_combat:      { name_ru: "Бой в кампании",            name_en: "Campaign Combat" },
  cards:                { name_ru: "Карты",                     name_en: "Cards" },
  components:           { name_ru: "Компоненты",                name_en: "Components" },
  cooperative:          { name_ru: "Кооперативный режим",       name_en: "Cooperative" },
  deckbuilding:         { name_ru: "Составление колоды",        name_en: "Deck Building" },
  differences:          { name_ru: "Отличия от оригинала",      name_en: "Differences" },
  editor:               { name_ru: "Редактор",                  name_en: "Editor" },
  game_mechanics:       { name_ru: "Игровая механика",          name_en: "Game Mechanics" },
  global:               { name_ru: "Общие правила",             name_en: "Global Rules" },
  interaction:          { name_ru: "Взаимодействие",            name_en: "Interaction" },
  locations:            { name_ru: "Локации",                   name_en: "Locations" },
  mode:                 { name_ru: "Режим игры",                name_en: "Game Mode" },
  morale:               { name_ru: "Мораль",                    name_en: "Morale" },
  reference:            { name_ru: "Справочник",                name_en: "Reference" },
  round_effects:        { name_ru: "Эффекты раунда",            name_en: "Round Effects" },
  rounds:               { name_ru: "Раунды",                    name_en: "Rounds" },
  scoring:              { name_ru: "Подсчёт очков",             name_en: "Scoring" },
  settings:             { name_ru: "Настройка игры",            name_en: "Setup" },
  solo_mode:            { name_ru: "Одиночный режим",           name_en: "Solo Mode" },
  specialty:            { name_ru: "Специализация",             name_en: "Specialty" },
  statistics:           { name_ru: "Статистика",                name_en: "Statistics" },
  storage:              { name_ru: "Хранение",                  name_en: "Storage" },
  timed:                { name_ru: "Игра на время",             name_en: "Timed" },
  timed_event:          { name_ru: "Событие по таймеру",        name_en: "Timed Event" },
  unit_ability:         { name_ru: "Способности юнитов",        name_en: "Unit Abilities" },
  war_machine:          { name_ru: "Боевые машины",             name_en: "War Machines" },
};

function deriveRuleCatBi(rule: Rule): BiName {
  const key = rule.category || "general";
  return RULE_CAT_MAP[key] ?? { name_ru: key, name_en: key };
}

/** key for tree map — uses ru name as internal key */
function biKey(b: BiName): string {
  return b.name_ru;
}

/* ─── PIN Screen ─── */

function PinScreen({ onAuth }: { onAuth: (pin: string) => void }) {
  const [mode, setMode] = useState<"check" | "create" | "confirm">("check");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("adminPin");
    if (saved) {
      setStoredPin(saved);
      setMode("check");
    } else {
      setMode("create");
    }
  }, []);

  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const id = setInterval(() => {
      const left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) { setCountdown(0); setAttempts(0); clearInterval(id); }
      else setCountdown(left);
    }, 500);
    return () => clearInterval(id);
  }, [lockUntil]);

  const locked = countdown > 0;

  const handleDigit = (d: string) => {
    if (locked) return;
    if (mode === "create") { if (pin.length < 4) setPin(p => p + d); }
    else if (mode === "confirm") { if (confirmPin.length < 4) setConfirmPin(p => p + d); }
    else { if (pin.length < 4) setPin(p => p + d); }
    setError("");
  };

  const handleDelete = () => {
    if (mode === "confirm") setConfirmPin(p => p.slice(0, -1));
    else setPin(p => p.slice(0, -1));
  };

  const handleSubmit = () => {
    if (mode === "create") { if (pin.length !== 4) return; setMode("confirm"); return; }
    if (mode === "confirm") {
      if (confirmPin !== pin) { setError("PIN не совпадает"); setConfirmPin(""); return; }
      sessionStorage.setItem("adminPin", pin);
      onAuth(pin);
      return;
    }
    if (pin === storedPin) { onAuth(pin); return; }
    const next = attempts + 1;
    setAttempts(next);
    setPin("");
    if (next >= 3) { setLockUntil(Date.now() + 60000); setCountdown(60); setError("Слишком много попыток"); }
    else setError(`Неверный PIN (попытка ${next}/3)`);
  };

  useEffect(() => {
    const current = mode === "confirm" ? confirmPin : pin;
    if (current.length === 4) { const t = setTimeout(handleSubmit, 150); return () => clearTimeout(t); }
  }, [pin, confirmPin]);

  const currentValue = mode === "confirm" ? confirmPin : pin;
  const title = mode === "create" ? "Создать PIN" : mode === "confirm" ? "Подтвердите PIN" : "Введите PIN";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-2">
          <Lock className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${i < currentValue.length ? "bg-primary border-primary" : "border-muted-foreground"}`} />
          ))}
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {locked && <p className="text-center text-sm text-muted-foreground">Повторите через {countdown} сек.</p>}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((d, i) => {
            if (d === null) return <div key={i} />;
            if (d === "del") return (
              <button key="del" onClick={handleDelete} className="h-14 rounded-xl bg-muted text-foreground text-lg font-medium hover:bg-accent transition-colors">←</button>
            );
            return (
              <button key={d} onClick={() => handleDigit(String(d))} disabled={locked} className="h-14 rounded-xl bg-card border border-border text-foreground text-lg font-semibold hover:bg-accent disabled:opacity-40 transition-colors">{d}</button>
            );
          })}
        </div>
        {mode === "check" && (
          <Collapsible open={showRecovery} onOpenChange={setShowRecovery}>
            <CollapsibleTrigger className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">Забыли PIN?</CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground leading-relaxed">
              Откройте файл JSON в GitHub и найдите поле <code className="text-primary">adminPin</code>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/* ─── Sortable card (generic) ─── */

function SortableCard({ id, title, subtitle, thumbnailUrl, isOverlay, onEdit, onDelete }: {
  id: string; title: string; subtitle?: string; thumbnailUrl?: string | null; isOverlay?: boolean;
  onEdit?: () => void; onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = isOverlay ? undefined : { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`group/card flex items-center gap-2 p-2 rounded-lg bg-card border border-border ${isOverlay ? "shadow-xl ring-2 ring-primary" : ""}`}>
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      {thumbnailUrl && (
        <img src={thumbnailUrl} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-xs text-card-foreground truncate block">{title}</span>
        {subtitle && <span className="text-[10px] text-muted-foreground truncate block">{subtitle}</span>}
      </div>
      {!isOverlay && (onEdit || onDelete) && (
        <div className="flex gap-1 shrink-0 opacity-0 group-hover/card:opacity-100 max-md:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Droppable subcategory label ─── */

function DroppableSubcategory({ dropId, label, count, isActive, isOver, onClick }: {
  dropId: string; label: string; count: number; isActive: boolean; isOver: boolean; onClick: () => void;
}) {
  const { setNodeRef, isOver: dndOver } = useSortable({ id: dropId, disabled: true });
  const highlight = isOver || dndOver;

  return (
    <button ref={setNodeRef} onClick={onClick} className={`w-full text-left pl-8 pr-3 py-1.5 text-xs rounded transition-colors ${
      isActive ? "bg-primary/20 text-primary font-medium" : highlight ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
    }`}>
      {label} <span className="text-muted-foreground">({count})</span>
    </button>
  );
}

/* ─── Bilingual name input ─── */

function BiNameInput({ nameRu, nameEn, onChangeRu, onChangeEn, autoFocus }: {
  nameRu: string; nameEn: string; onChangeRu: (v: string) => void; onChangeEn: (v: string) => void; autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1">
      <input autoFocus={autoFocus} value={nameRu} onChange={e => onChangeRu(e.target.value)} placeholder="Название (RU)"
        className="w-full text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
      <input value={nameEn} onChange={e => onChangeEn(e.target.value)} placeholder="Name (EN)"
        className="w-full text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
    </div>
  );
}

/* ─── Instruction Modal ─── */

function InstructionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    'Нажмите «Экспорт JSON» — файл скачается автоматически',
    "Откройте ваш GitHub репозиторий",
    "Найдите файл merged_database_final.json",
    "Нажмите на файл → Edit (карандаш) → вставьте содержимое нового файла",
    "Нажмите Commit changes",
    "Lovable автоматически подтянет изменения из GitHub (или пересоберите вручную)",
    "Проверьте результат в приложении",
  ];
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Что делать после редактирования</DialogTitle></DialogHeader>
        <ol className="space-y-2 text-sm text-foreground list-decimal pl-5">
          {steps.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Generic tree+grid panel ─── */

type TreeMap<T> = Record<string, Record<string, T[]>>;

interface TreeItem {
  id: string;
  category_ru: string;
  category_en: string;
  subcategory_ru: string;
  subcategory_en: string;
}

function buildTree<T extends TreeItem>(items: T[]): TreeMap<T> {
  const map: TreeMap<T> = {};
  for (const item of items) {
    const catKey = item.category_ru;
    const subKey = item.subcategory_ru;
    if (!map[catKey]) map[catKey] = {};
    if (!map[catKey][subKey]) map[catKey][subKey] = [];
    map[catKey][subKey].push(item);
  }
  return map;
}

/** Find the EN name for a given RU cat/sub key from the items */
function findEnName<T extends TreeItem>(items: T[], ruKey: string, field: "category" | "subcategory"): string {
  const item = items.find(i => field === "category" ? i.category_ru === ruKey : i.subcategory_ru === ruKey);
  return item ? (field === "category" ? item.category_en : item.subcategory_en) : ruKey;
}

interface CategoryTreePanelProps<T extends TreeItem> {
  items: T[];
  tree: TreeMap<T>;
  prefix: string;
  openCats: Set<string>;
  toggleCat: (cat: string) => void;
  activeSub: { cat: string; sub: string } | null;
  setActiveSub: (v: { cat: string; sub: string } | null) => void;
  overSubId: string | null;
  onAddCategory: (ru: string, en: string) => void;
  onAddSubcategory: (catRu: string, subRu: string, subEn: string) => void;
  onRenameCategory: (oldRu: string, newRu: string, newEn: string) => void;
  onRenameSubcategory: (catRu: string, oldSubRu: string, newSubRu: string, newSubEn: string) => void;
  onDeleteCategory?: (catRu: string) => void;
  onDeleteSubcategory?: (catRu: string, subRu: string) => void;
  extraFooter?: React.ReactNode;
}

function CategoryTreePanel<T extends TreeItem>({
  items, tree, prefix, openCats, toggleCat, activeSub, setActiveSub, overSubId, onAddCategory, onAddSubcategory, onRenameCategory, onRenameSubcategory, onDeleteCategory, onDeleteSubcategory, extraFooter,
}: CategoryTreePanelProps<T>) {
  const categories = useMemo(() => Object.keys(tree).sort(), [tree]);

  const [newCatRu, setNewCatRu] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubRu, setNewSubRu] = useState("");
  const [newSubEn, setNewSubEn] = useState("");

  // Rename state
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatRu, setEditCatRu] = useState("");
  const [editCatEn, setEditCatEn] = useState("");
  const [editingSub, setEditingSub] = useState<{ cat: string; sub: string } | null>(null);
  const [editSubRu, setEditSubRu] = useState("");
  const [editSubEn, setEditSubEn] = useState("");

  const handleAddCat = () => {
    const ru = newCatRu.trim();
    const en = newCatEn.trim() || ru;
    if (!ru) return;
    onAddCategory(ru, en);
    setNewCatRu("");
    setNewCatEn("");
  };

  const handleAddSub = (catRu: string) => {
    const ru = newSubRu.trim();
    const en = newSubEn.trim() || ru;
    if (!ru) return;
    onAddSubcategory(catRu, ru, en);
    setAddingSubFor(null);
    setNewSubRu("");
    setNewSubEn("");
  };

  const startEditCat = (catRu: string, catEn: string) => {
    setEditingCat(catRu);
    setEditCatRu(catRu);
    setEditCatEn(catEn);
  };

  const confirmEditCat = () => {
    if (!editingCat) return;
    const ru = editCatRu.trim();
    const en = editCatEn.trim() || ru;
    if (ru) onRenameCategory(editingCat, ru, en);
    setEditingCat(null);
  };

  const startEditSub = (catRu: string, subRu: string, subEn: string) => {
    setEditingSub({ cat: catRu, sub: subRu });
    setEditSubRu(subRu);
    setEditSubEn(subEn);
  };

  const confirmEditSub = () => {
    if (!editingSub) return;
    const ru = editSubRu.trim();
    const en = editSubEn.trim() || ru;
    if (ru) onRenameSubcategory(editingSub.cat, editingSub.sub, ru, en);
    setEditingSub(null);
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border overflow-y-auto p-3 space-y-1">
      {categories.map(catRu => {
        const subs = Object.keys(tree[catRu]).sort();
        const isOpen = openCats.has(catRu);
        const catEn = findEnName(items, catRu, "category");

        if (editingCat === catRu) {
          return (
            <div key={catRu} className="px-2 py-1.5 space-y-1 rounded bg-muted/50">
              <input autoFocus value={editCatRu} onChange={e => setEditCatRu(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmEditCat(); if (e.key === "Escape") setEditingCat(null); }}
                placeholder="RU" className="w-full text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
              <input value={editCatEn} onChange={e => setEditCatEn(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmEditCat(); if (e.key === "Escape") setEditingCat(null); }}
                placeholder="EN" className="w-full text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={confirmEditCat}><Check className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingCat(null)}>✕</Button>
              </div>
            </div>
          );
        }

        return (
          <Collapsible key={catRu} open={isOpen} onOpenChange={() => toggleCat(catRu)}>
            <div className="group flex items-center">
              <CollapsibleTrigger className="flex-1 flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-foreground hover:bg-accent rounded transition-colors">
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                <span className="truncate">{catRu}</span>
                <span className="text-[10px] text-muted-foreground ml-1">/ {catEn}</span>
              </CollapsibleTrigger>
              <button onClick={(e) => { e.stopPropagation(); startEditCat(catRu, catEn); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity shrink-0">
                <Pencil className="w-3 h-3" />
              </button>
              {onDeleteCategory && (
                <button onClick={(e) => { e.stopPropagation(); onDeleteCategory(catRu); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <CollapsibleContent className="space-y-0.5 mt-0.5">
              {subs.map(subRu => {
                const count = tree[catRu][subRu].length;
                const isActive = activeSub?.cat === catRu && activeSub?.sub === subRu;
                const dropId = `${prefix}drop:${catRu}/${subRu}`;
                const subEn = findEnName(items, subRu, "subcategory");

                if (editingSub?.cat === catRu && editingSub?.sub === subRu) {
                  return (
                    <div key={dropId} className="pl-6 pr-2 py-1 space-y-1 rounded bg-muted/50">
                      <input autoFocus value={editSubRu} onChange={e => setEditSubRu(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") confirmEditSub(); if (e.key === "Escape") setEditingSub(null); }}
                        placeholder="RU" className="w-full text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      <input value={editSubEn} onChange={e => setEditSubEn(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") confirmEditSub(); if (e.key === "Escape") setEditingSub(null); }}
                        placeholder="EN" className="w-full text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={confirmEditSub}><Check className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingSub(null)}>✕</Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={dropId} className="group/sub flex items-center">
                    <DroppableSubcategory
                      dropId={dropId}
                      label={`${subRu} / ${subEn}`}
                      count={count}
                      isActive={isActive}
                      isOver={overSubId === dropId}
                      onClick={() => setActiveSub({ cat: catRu, sub: subRu })}
                    />
                    <button onClick={() => startEditSub(catRu, subRu, subEn)}
                      className="opacity-0 group-hover/sub:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity shrink-0">
                      <Pencil className="w-3 h-3" />
                    </button>
                    {onDeleteSubcategory && (
                      <button onClick={() => onDeleteSubcategory(catRu, subRu)}
                        className="opacity-0 group-hover/sub:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              {addingSubFor === catRu ? (
                <div className="pl-6 pr-2 py-1 space-y-1">
                  <BiNameInput nameRu={newSubRu} nameEn={newSubEn} onChangeRu={setNewSubRu} onChangeEn={setNewSubEn} autoFocus />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleAddSub(catRu)}>OK</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setAddingSubFor(null)}>✕</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setAddingSubFor(catRu); setNewSubRu(""); setNewSubEn(""); }}
                  className="pl-8 py-1 text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Добавить подкатегорию
                </button>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      <div className="pt-2 space-y-1">
        <BiNameInput nameRu={newCatRu} nameEn={newCatEn} onChangeRu={setNewCatRu} onChangeEn={setNewCatEn} />
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs w-full" onClick={handleAddCat}>
          <Plus className="w-3 h-3 mr-1" /> Добавить категорию
        </Button>
      </div>
      {extraFooter}
    </aside>
  );
}

/* ─── Admin Dashboard ─── */

function AdminDashboard({ adminPin }: { adminPin: string }) {
  const { components, rules, loaded } = useRules();
  const navigate = useNavigate();
  const [showInstruction, setShowInstruction] = useState(false);
  const [activeTab, setActiveTab] = useState<"components" | "rules" | "categories">("components");

  // Edit / Delete state
  const [editItem, setEditItem] = useState<{ type: "component" | "rule"; item: AdminComponent | AdminRule } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: "component" | "rule"; item: AdminComponent | AdminRule } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // === Dynamic component types ===
  const [componentTypes, setComponentTypes] = useState<{ key: string; label_ru: string; label_en: string; sort_order: number }[]>([]);
  const [newTypeKey, setNewTypeKey] = useState("");
  const [newTypeLabelRu, setNewTypeLabelRu] = useState("");
  const [newTypeLabelEn, setNewTypeLabelEn] = useState("");

  useEffect(() => {
    supabase.from("component_types").select("*").order("sort_order")
      .then(({ data, error }) => {
        if (data) setComponentTypes(data as any);
        if (error) console.error("[Admin] Failed to load component_types:", error);
      });
  }, []);

  const handleAddType = async () => {
    const key = newTypeKey.trim().toLowerCase();
    const labelRu = newTypeLabelRu.trim();
    const labelEn = newTypeLabelEn.trim() || labelRu;
    if (!key || !labelRu) return;
    if (!/^[a-z_]+$/.test(key)) { alert("Key must be lowercase letters and underscores only"); return; }
    if (componentTypes.some(t => t.key === key)) { alert("Type already exists"); return; }
    const newType = { key, label_ru: labelRu, label_en: labelEn, sort_order: componentTypes.length };
    const { error } = await supabase.from("component_types").insert(newType as any);
    if (error) { alert("Failed to add type: " + error.message); return; }
    setComponentTypes(prev => [...prev, newType]);
    setNewTypeKey(""); setNewTypeLabelRu(""); setNewTypeLabelEn("");
  };

  const handleDeleteType = async (key: string) => {
    if (!confirm(`Delete type "${key}"?`)) return;
    const { error } = await supabase.from("component_types").delete().eq("key", key);
    if (error) { alert("Failed to delete type: " + error.message); return; }
    setComponentTypes(prev => prev.filter(t => t.key !== key));
  };

  // === Components state ===
  const [adminComps, setAdminComps] = useState<AdminComponent[]>([]);
  useEffect(() => {
    if (!loaded) return;
    setAdminComps(components.map(c => {
      const typeKey = (c as any).type;
      const typeInfo = typeKey ? componentTypes.find(t => t.key === typeKey) : null;
      const isUncategorized = !typeKey || !typeInfo;
      const catRu = isUncategorized ? "Другие" : typeInfo!.label_ru;
      const catEn = isUncategorized ? "Other" : typeInfo!.label_en;
      const subBi = typeKey === "unit" ? deriveFactionBi(c) : { name_ru: "Общее", name_en: "General" };
      return {
        ...c,
        category_ru: catRu,
        category_en: catEn,
        subcategory_ru: (c as any).subcategory_ru || subBi.name_ru,
        subcategory_en: (c as any).subcategory_en || subBi.name_en,
      };
    }));
  }, [loaded, components, componentTypes]);

  // === Create new component ===
  const [showCreateComp, setShowCreateComp] = useState(false);
  const [newComp, setNewComp] = useState({ title_ru: "", title_en: "", body_ru: "", body_en: "", type: "" });

  const handleCreateComponent = async () => {
    if (!newComp.title_ru.trim() || !newComp.type) { alert("Заполните название (RU) и тип"); return; }
    const id = crypto.randomUUID();
    const { data, error } = await supabase.from("components").insert({
      id, title_ru: newComp.title_ru.trim(), title_en: newComp.title_en.trim(),
      body_ru: newComp.body_ru.trim(), body_en: newComp.body_en.trim(),
      type: newComp.type, category: "",
    } as any).select();
    if (error) { alert("Ошибка: " + error.message); return; }
    if (data?.[0]) {
      const row = data[0] as any;
      const typeInfo = componentTypes.find(t => t.key === row.type);
      setAdminComps(prev => [...prev, {
        ...row, description_ru: row.body_ru, description_en: row.body_en,
        category_ru: typeInfo?.label_ru || row.type,
        category_en: typeInfo?.label_en || row.type,
        subcategory_ru: "Общее", subcategory_en: "General",
      }]);
    }
    setNewComp({ title_ru: "", title_en: "", body_ru: "", body_en: "", type: "" });
    setShowCreateComp(false);
  };

  // === Rules state ===
  const [adminRules, setAdminRules] = useState<AdminRule[]>([]);
  useEffect(() => {
    if (!loaded) return;
    setAdminRules(rules.map(r => {
      const key = r.category || "general";
      const mapEntry = RULE_CAT_MAP[key];
      return {
        ...r,
        category_ru: mapEntry?.name_ru || key,
        category_en: mapEntry?.name_en || key,
        subcategory_ru: (r as any).subcategory_ru || "Общее",
        subcategory_en: (r as any).subcategory_en || "General",
      };
    }));
  }, [loaded, rules]);

  // === Components tree ===
  const [compVirtualSubs, setCompVirtualSubs] = useState<{ cat: string; sub: string }[]>([]);
  const compTree = useMemo(() => {
    const t = buildTree(adminComps);
    for (const v of compVirtualSubs) {
      if (!t[v.cat]) t[v.cat] = {};
      if (!t[v.cat][v.sub]) t[v.cat][v.sub] = [];
    }
    return t;
  }, [adminComps, compVirtualSubs]);
  const [compOpenCats, setCompOpenCats] = useState<Set<string>>(new Set());
  const [compActiveSub, setCompActiveSub] = useState<{ cat: string; sub: string } | null>(null);
  const [compDragItem, setCompDragItem] = useState<AdminComponent | null>(null);
  const [compOverSubId, setCompOverSubId] = useState<string | null>(null);

  const toggleCompCat = useCallback((cat: string) => {
    setCompOpenCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }, []);

  const compActiveItems = useMemo(() => {
    if (!compActiveSub) return [];
    return compTree[compActiveSub.cat]?.[compActiveSub.sub] ?? [];
  }, [compActiveSub, compTree]);

  // === Rules tree ===
  const ruleTree = useMemo(() => buildTree(adminRules), [adminRules]);
  const [ruleOpenCats, setRuleOpenCats] = useState<Set<string>>(new Set());
  const [ruleActiveSub, setRuleActiveSub] = useState<{ cat: string; sub: string } | null>(null);
  const [ruleDragItem, setRuleDragItem] = useState<AdminRule | null>(null);
  const [ruleOverSubId, setRuleOverSubId] = useState<string | null>(null);

  const toggleRuleCat = useCallback((cat: string) => {
    setRuleOpenCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }, []);

  const ruleActiveItems = useMemo(() => {
    if (!ruleActiveSub) return [];
    return ruleTree[ruleActiveSub.cat]?.[ruleActiveSub.sub] ?? [];
  }, [ruleActiveSub, ruleTree]);

  // === DnD ===
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => {
    if (activeTab === "components") {
      const item = adminComps.find(c => c.id === e.active.id);
      if (item) setCompDragItem(item);
    } else {
      const item = adminRules.find(r => r.id === e.active.id);
      if (item) setRuleDragItem(item);
    }
  };

  const handleDragOver = (e: DragOverEvent) => {
    const overId = e.over?.id as string | undefined;
    const pfx = activeTab === "components" ? "comp-" : "rule-";
    if (overId?.startsWith(`${pfx}drop:`)) {
      if (activeTab === "components") setCompOverSubId(overId);
      else setRuleOverSubId(overId);
    } else {
      setCompOverSubId(null);
      setRuleOverSubId(null);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const overId = e.over?.id as string | undefined;
    if (activeTab === "components" && compDragItem) {
      const pfx = "comp-drop:";
      if (overId?.startsWith(pfx)) {
        const rest = overId.replace(pfx, "");
        const slashIdx = rest.indexOf("/");
        const catRu = rest.slice(0, slashIdx);
        const subRu = rest.slice(slashIdx + 1);
        if (catRu && subRu) {
          const catEn = findEnName(adminComps, catRu, "category") || catRu;
          const subEn = findEnName(adminComps, subRu, "subcategory") || subRu;
          setAdminComps(prev => prev.map(c =>
            c.id === compDragItem.id ? { ...c, category_ru: catRu, category_en: catEn, subcategory_ru: subRu, subcategory_en: subEn } : c
          ));
        }
      }
      setCompDragItem(null);
    }
    if (activeTab === "rules" && ruleDragItem) {
      const pfx = "rule-drop:";
      if (overId?.startsWith(pfx)) {
        const rest = overId.replace(pfx, "");
        const slashIdx = rest.indexOf("/");
        const catRu = rest.slice(0, slashIdx);
        const subRu = rest.slice(slashIdx + 1);
        if (catRu && subRu) {
          const catEn = findEnName(adminRules, catRu, "category") || catRu;
          const subEn = findEnName(adminRules, subRu, "subcategory") || subRu;
          setAdminRules(prev => prev.map(r =>
            r.id === ruleDragItem.id ? { ...r, category_ru: catRu, category_en: catEn, subcategory_ru: subRu, subcategory_en: subEn } : r
          ));
        }
      }
      setRuleDragItem(null);
    }
    setCompOverSubId(null);
    setRuleOverSubId(null);
  };

  // === Add category/subcategory ===
  const handleAddCompCategory = (ru: string, _en: string) => {
    setCompOpenCats(prev => new Set([...prev, ru]));
  };
  const handleAddCompSubcategory = (catRu: string, subRu: string, _subEn: string) => {
    setCompVirtualSubs(prev => [...prev, { cat: catRu, sub: subRu }]);
  };
  const handleAddRuleCategory = (ru: string, _en: string) => {
    setRuleOpenCats(prev => new Set([...prev, ru]));
  };
  const handleAddRuleSubcategory = (_catRu: string, _subRu: string, _subEn: string) => {};

  // === Rename category/subcategory ===
  const handleRenameCompCategory = (oldRu: string, newRu: string, newEn: string) => {
    setAdminComps(prev => prev.map(c =>
      c.category_ru === oldRu ? { ...c, category_ru: newRu, category_en: newEn } : c
    ));
    if (compActiveSub?.cat === oldRu) setCompActiveSub({ cat: newRu, sub: compActiveSub.sub });
    setCompOpenCats(prev => { const n = new Set(prev); if (n.has(oldRu)) { n.delete(oldRu); n.add(newRu); } return n; });
  };
  const handleRenameCompSubcategory = (catRu: string, oldSubRu: string, newSubRu: string, newSubEn: string) => {
    setAdminComps(prev => prev.map(c =>
      c.category_ru === catRu && c.subcategory_ru === oldSubRu ? { ...c, subcategory_ru: newSubRu, subcategory_en: newSubEn } : c
    ));
    if (compActiveSub?.cat === catRu && compActiveSub?.sub === oldSubRu) setCompActiveSub({ cat: catRu, sub: newSubRu });
  };
  const handleRenameRuleCategory = (oldRu: string, newRu: string, newEn: string) => {
    setAdminRules(prev => prev.map(r =>
      r.category_ru === oldRu ? { ...r, category_ru: newRu, category_en: newEn } : r
    ));
    if (ruleActiveSub?.cat === oldRu) setRuleActiveSub({ cat: newRu, sub: ruleActiveSub.sub });
    setRuleOpenCats(prev => { const n = new Set(prev); if (n.has(oldRu)) { n.delete(oldRu); n.add(newRu); } return n; });
  };
  const handleRenameRuleSubcategory = (catRu: string, oldSubRu: string, newSubRu: string, newSubEn: string) => {
    setAdminRules(prev => prev.map(r =>
      r.category_ru === catRu && r.subcategory_ru === oldSubRu ? { ...r, subcategory_ru: newSubRu, subcategory_en: newSubEn } : r
    ));
    if (ruleActiveSub?.cat === catRu && ruleActiveSub?.sub === oldSubRu) setRuleActiveSub({ cat: catRu, sub: newSubRu });
  };

  // === Delete category/subcategory ===
  const handleDeleteCompCategory = async (catRu: string) => {
    const typeEntry = componentTypes.find(t => t.label_ru === catRu);
    if (!typeEntry) return;
    if (!confirm(`Удалить категорию "${catRu}"? Все компоненты будут перемещены в "Другие".`)) return;
    await supabase.from("components").update({ type: null } as any).eq("type", typeEntry.key);
    await supabase.from("component_types").delete().eq("key", typeEntry.key);
    setComponentTypes(prev => prev.filter(t => t.key !== typeEntry.key));
    setAdminComps(prev => prev.map(c =>
      c.category_ru === catRu ? { ...c, type: null as any, category_ru: "Другие", category_en: "Other", subcategory_ru: "Общее", subcategory_en: "General" } : c
    ));
    if (compActiveSub?.cat === catRu) setCompActiveSub(null);
  };
  const handleDeleteCompSubcategory = async (catRu: string, subRu: string) => {
    if (!confirm(`Удалить подкатегорию "${subRu}"? Компоненты будут перемещены в "Общее".`)) return;
    const factionKey = Object.entries(FACTION_MAP).find(([_, v]) => v.name_ru === subRu)?.[0];
    if (factionKey) {
      await supabase.from("components").update({ faction: null } as any).eq("faction", factionKey);
    }
    setAdminComps(prev => prev.map(c =>
      c.category_ru === catRu && c.subcategory_ru === subRu
        ? { ...c, subcategory_ru: "Общее", subcategory_en: "General" }
        : c
    ));
    setCompVirtualSubs(prev => prev.filter(v => !(v.cat === catRu && v.sub === subRu)));
    if (compActiveSub?.cat === catRu && compActiveSub?.sub === subRu) setCompActiveSub(null);
  };

  // === Edit / Delete handlers ===
  const editCategories = useMemo(() => {
    if (!editItem) return [];
    if (editItem.type === "component") {
      return []; // Components are grouped by type, not category — hide category selector
    }
    return Object.entries(RULE_CAT_MAP).map(([key, bi]) => ({ key, label: `${bi.name_ru} / ${bi.name_en}` }));
  }, [editItem]);

  const editModalItem = useMemo(() => {
    if (!editItem) return null;
    const { type, item } = editItem;
    if (type === "component") {
      const comp = item as AdminComponent;
      return {
        id: comp.id,
        title_en: comp.title_en || "",
        title_ru: comp.title_ru || "",
        body_en: comp.description_en || "",
        body_ru: comp.description_ru || "",
        category: "",
        type: comp.type || "other",
        media_url: (comp as any).media_url || null,
      };
    }
    const rule = item as AdminRule;
    return {
      id: rule.id,
      title_en: rule.title_en || "",
      title_ru: rule.title_ru || "",
      body_en: rule.text_en || "",
      body_ru: rule.text_ru || "",
      category: rule.category || "",
    };
  }, [editItem]);

  const handleSaveEdit = async (saveData: { title_en: string; title_ru: string; body_en: string; body_ru: string; category: string; type?: string; media_url?: string | null }) => {
    if (!editItem) return;
    const { type, item } = editItem;
    if (type === "component") {
      const { data: result, error } = await supabase.from("components").update({
        title_en: saveData.title_en, title_ru: saveData.title_ru,
        body_en: saveData.body_en, body_ru: saveData.body_ru,
        type: saveData.type || "other",
        category: "",
        media_url: saveData.media_url ?? null,
      } as any).eq("id", item.id).select();
      console.log("[Admin] Component update response:", { result, error });
      if (error) {
        console.error("[Admin] Component update failed:", error);
        alert("Save failed: " + error.message);
        return;
      }
      setAdminComps(prev => prev.map(c =>
        c.id === item.id ? { ...c, title_en: saveData.title_en, title_ru: saveData.title_ru, description_en: saveData.body_en, description_ru: saveData.body_ru, type: saveData.type || "other", media_url: saveData.media_url ?? null } as any : c
      ));
    } else {
      const { data: result, error } = await supabase.from("rules").update({
        title_en: saveData.title_en, title_ru: saveData.title_ru,
        text_en: saveData.body_en, text_ru: saveData.body_ru, category: saveData.category,
      }).eq("id", item.id).select();
      console.log("[Admin] Rule update response:", { result, error });
      if (error) {
        console.error("[Admin] Rule update failed:", error);
        alert("Save failed: " + error.message);
        return;
      }
      setAdminRules(prev => prev.map(r =>
        r.id === item.id ? { ...r, title_en: saveData.title_en, title_ru: saveData.title_ru, text_en: saveData.body_en, text_ru: saveData.body_ru, category: saveData.category } : r
      ));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    const { type, item } = deleteItem;
    if (type === "component") {
      await supabase.from("components").delete().eq("id", item.id);
      setAdminComps(prev => prev.filter(c => c.id !== item.id));
    } else {
      await supabase.from("rules").delete().eq("id", item.id);
      setAdminRules(prev => prev.filter(r => r.id !== item.id));
    }
    setIsDeleting(false);
    setDeleteItem(null);
  };

  // === Export ===
  const handleExport = () => {
    const output = {
      rules: adminRules.map(({ category, ...rest }) => ({
        ...rest,
      })),
      components: adminComps.map(({ category, subcategory, ...rest }: any) => ({
        ...rest,
      })),
      adminPin,
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_database_final.json";
    a.click();
    URL.revokeObjectURL(url);
    alert("Файл скачан. Замените его в GitHub и задеплойте.");
  };

  const handleLogout = () => { sessionStorage.removeItem("adminPin"); navigate("/"); };

  if (!loaded) {
    return <div className="min-h-dvh flex items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Загрузка…</p></div>;
  }

  const dragItem = activeTab === "components" ? compDragItem : ruleDragItem;
  const dragTitle = dragItem
    ? (activeTab === "components"
      ? ((dragItem as AdminComponent).title_ru || (dragItem as AdminComponent).title_en || dragItem.id)
      : ((dragItem as AdminRule).title_ru || (dragItem as AdminRule).title_en || dragItem.id))
    : "";

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="min-h-dvh flex flex-col bg-background">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 flex-wrap">
          <h1 className="text-lg font-semibold text-foreground mr-auto">Админ-панель</h1>
          <Button size="sm" variant="outline" onClick={() => setShowInstruction(true)}>
            <HelpCircle className="w-4 h-4 mr-1" /> Инструкция
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Экспорт JSON
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> Выйти
          </Button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          <button onClick={() => setActiveTab("components")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "components" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Компоненты
          </button>
          <button onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "rules" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Правила
          </button>
          <button onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "categories" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Категории
          </button>
        </div>

        {/* Two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "components" ? (
            <>
              <CategoryTreePanel
                items={adminComps}
                tree={compTree}
                prefix="comp-"
                openCats={compOpenCats}
                toggleCat={toggleCompCat}
                activeSub={compActiveSub}
                setActiveSub={setCompActiveSub}
                overSubId={compOverSubId}
                onAddCategory={handleAddCompCategory}
                onAddSubcategory={handleAddCompSubcategory}
                onRenameCategory={handleRenameCompCategory}
                onRenameSubcategory={handleRenameCompSubcategory}
                onDeleteCategory={handleDeleteCompCategory}
                onDeleteSubcategory={handleDeleteCompSubcategory}
                extraFooter={
                  <div className="border-t border-border pt-3 mt-3 space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground px-2">Типы компонентов</h4>
                    <div className="space-y-1 px-2">
                      {componentTypes.map(t => (
                        <div key={t.key} className="flex items-center gap-1 text-[11px] text-foreground">
                          <span className="truncate flex-1">{t.key} — {t.label_ru}</span>
                          <button onClick={() => handleDeleteType(t.key)} className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="px-2 space-y-1">
                      <input value={newTypeKey} onChange={e => setNewTypeKey(e.target.value)} placeholder="key (latin)"
                        className="w-full text-[11px] px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      <input value={newTypeLabelRu} onChange={e => setNewTypeLabelRu(e.target.value)} placeholder="Label RU"
                        className="w-full text-[11px] px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      <input value={newTypeLabelEn} onChange={e => setNewTypeLabelEn(e.target.value)} placeholder="Label EN"
                        className="w-full text-[11px] px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] w-full" onClick={handleAddType}>
                        <Plus className="w-3 h-3 mr-1" /> Добавить тип
                      </Button>
                    </div>
                  </div>
                }
              />
              <main className="flex-1 overflow-y-auto p-4">
                {/* Create Component Button */}
                <div className="mb-4">
                  <Button size="sm" variant="outline" onClick={() => setShowCreateComp(!showCreateComp)}>
                    <Plus className="w-4 h-4 mr-1" /> Создать компонент
                  </Button>
                </div>

                {/* Create Component Form */}
                {showCreateComp && (
                  <div className="mb-6 p-4 rounded-lg border border-border bg-card space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Новый компонент</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Название RU *</label>
                        <input value={newComp.title_ru} onChange={e => setNewComp(p => ({ ...p, title_ru: e.target.value }))}
                          className="w-full text-xs px-2 py-1.5 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Название EN</label>
                        <input value={newComp.title_en} onChange={e => setNewComp(p => ({ ...p, title_en: e.target.value }))}
                          className="w-full text-xs px-2 py-1.5 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Описание RU</label>
                        <textarea value={newComp.body_ru} onChange={e => setNewComp(p => ({ ...p, body_ru: e.target.value }))} rows={3}
                          className="w-full text-xs px-2 py-1.5 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring resize-y" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Описание EN</label>
                        <textarea value={newComp.body_en} onChange={e => setNewComp(p => ({ ...p, body_en: e.target.value }))} rows={3}
                          className="w-full text-xs px-2 py-1.5 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring resize-y" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Тип *</label>
                      <select value={newComp.type} onChange={e => setNewComp(p => ({ ...p, type: e.target.value }))}
                        className="w-full text-xs px-2 py-1.5 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring">
                        <option value="">— Выберите тип —</option>
                        {componentTypes.map(t => (
                          <option key={t.key} value={t.key}>{t.key} — {t.label_ru} / {t.label_en}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateComponent}>Создать</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowCreateComp(false)}>Отмена</Button>
                    </div>
                  </div>
                )}

                {!compActiveSub ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground text-sm">Выберите подкатегорию слева</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-sm font-medium text-foreground mb-3">
                      {compActiveSub.cat} → {compActiveSub.sub}{" "}
                      <span className="text-muted-foreground font-normal">({compActiveItems.length})</span>
                    </h2>
                    <SortableContext items={compActiveItems.map(c => c.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {compActiveItems.map(comp => (
                          <SortableCard key={comp.id} id={comp.id} title={comp.title_ru || comp.title_en || comp.id}
                            onEdit={() => setEditItem({ type: "component", item: comp })}
                            onDelete={() => setDeleteItem({ type: "component", item: comp })}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    {compActiveItems.length === 0 && <p className="text-muted-foreground text-xs mt-4">Перетащите компоненты сюда</p>}
                  </>
                )}
              </main>
            </>
          ) : activeTab === "rules" ? (
            <>
              <CategoryTreePanel
                items={adminRules}
                tree={ruleTree}
                prefix="rule-"
                openCats={ruleOpenCats}
                toggleCat={toggleRuleCat}
                activeSub={ruleActiveSub}
                setActiveSub={setRuleActiveSub}
                overSubId={ruleOverSubId}
                onAddCategory={handleAddRuleCategory}
                onAddSubcategory={handleAddRuleSubcategory}
                onRenameCategory={handleRenameRuleCategory}
                onRenameSubcategory={handleRenameRuleSubcategory}
              />
              <main className="flex-1 overflow-y-auto p-4">
                {!ruleActiveSub ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">Выберите подкатегорию слева</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-sm font-medium text-foreground mb-3">
                      {ruleActiveSub.cat} → {ruleActiveSub.sub}{" "}
                      <span className="text-muted-foreground font-normal">({ruleActiveItems.length})</span>
                    </h2>
                    <SortableContext items={ruleActiveItems.map(r => r.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {ruleActiveItems.map(rule => (
                          <SortableCard key={rule.id} id={rule.id} title={rule.title_ru || rule.title_en || rule.id}
                            onEdit={() => setEditItem({ type: "rule", item: rule })}
                            onDelete={() => setDeleteItem({ type: "rule", item: rule })}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    {ruleActiveItems.length === 0 && <p className="text-muted-foreground text-xs mt-4">Перетащите правила сюда</p>}
                  </>
                )}
              </main>
            </>
          ) : (
            <CategoriesManager />
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {dragItem && <SortableCard id={dragItem.id} title={dragTitle} isOverlay />}
        </DragOverlay>
      </div>

      <EditItemModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editModalItem}
        categories={editCategories}
        showTypeField={editItem?.type === "component"}
        componentTypes={componentTypes}
        onSave={handleSaveEdit}
      />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        deleting={isDeleting}
      />
      <InstructionModal open={showInstruction} onClose={() => setShowInstruction(false)} />
    </DndContext>
  );
}

/* ─── Admin Page (root) ─── */

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");

  const handleAuth = (p: string) => { sessionStorage.setItem("adminPin", p); setPin(p); setAuthed(true); };

  useEffect(() => {
    const saved = sessionStorage.getItem("adminPin");
    if (saved) { setPin(saved); setAuthed(true); }
  }, []);

  if (!authed) return <PinScreen onAuth={handleAuth} />;
  return <AdminDashboard adminPin={pin} />;
}
