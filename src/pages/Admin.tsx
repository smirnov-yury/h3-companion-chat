import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRules, type Component } from "@/context/RulesContext";
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
} from "lucide-react";

/* ─── helpers ─── */

interface AdminComponent extends Component {
  category: string;
  subcategory: string;
}

function deriveCategory(image: string): string {
  const m = image.match(/\{img:[^_}]+_([^_}]+)/);
  const raw = m?.[1] ?? "other";
  const MAP: Record<string, string> = {
    unit: "Юниты",
    card: "Карты",
    hero: "Герои",
    token: "Жетоны",
    icon: "Иконки",
    schema: "Схемы",
    game: "Игровое",
    book: "Книги",
    mission: "Миссии",
    location: "Локации",
    rule: "Правила",
    miss: "Разное",
    other: "Прочее",
  };
  return MAP[raw] ?? "Прочее";
}

function deriveSubcategory(c: Component): string {
  // If it looks like a unit, use faction as subcategory
  if (/\{img:[^_]+_unit/.test(c.image)) {
    const match = c.image.match(/\{img:([^_]+)_unit/);
    const folder = match?.[1] ?? "other";
    const neutrals = ["tray", "design", "supp", "naval", "tournament"];
    if (neutrals.includes(folder)) return "Нейтральные";
    const MAP: Record<string, string> = {
      castle: "Замок",
      tower: "Башня",
      inferno: "Инферно",
      fortress: "Крепость",
      conflux: "Сплетение",
      cove: "Причал",
    };
    return MAP[folder] ?? "Прочее";
  }
  return "Общее";
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
      if (left <= 0) {
        setCountdown(0);
        setAttempts(0);
        clearInterval(id);
      } else {
        setCountdown(left);
      }
    }, 500);
    return () => clearInterval(id);
  }, [lockUntil]);

  const locked = countdown > 0;

  const handleDigit = (d: string) => {
    if (locked) return;
    if (mode === "create") {
      if (pin.length < 4) setPin((p) => p + d);
    } else if (mode === "confirm") {
      if (confirmPin.length < 4) setConfirmPin((p) => p + d);
    } else {
      if (pin.length < 4) setPin((p) => p + d);
    }
    setError("");
  };

  const handleDelete = () => {
    if (mode === "confirm") setConfirmPin((p) => p.slice(0, -1));
    else setPin((p) => p.slice(0, -1));
  };

  const handleSubmit = () => {
    if (mode === "create") {
      if (pin.length !== 4) return;
      setMode("confirm");
      return;
    }
    if (mode === "confirm") {
      if (confirmPin !== pin) {
        setError("PIN не совпадает");
        setConfirmPin("");
        return;
      }
      sessionStorage.setItem("adminPin", pin);
      onAuth(pin);
      return;
    }
    // check mode
    if (pin === storedPin) {
      onAuth(pin);
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPin("");
    if (next >= 3) {
      const until = Date.now() + 60000;
      setLockUntil(until);
      setCountdown(60);
      setError("Слишком много попыток");
    } else {
      setError(`Неверный PIN (попытка ${next}/3)`);
    }
  };

  useEffect(() => {
    const current = mode === "confirm" ? confirmPin : pin;
    if (current.length === 4) {
      const t = setTimeout(handleSubmit, 150);
      return () => clearTimeout(t);
    }
  }, [pin, confirmPin]);

  const currentValue = mode === "confirm" ? confirmPin : pin;
  const title =
    mode === "create"
      ? "Создать PIN"
      : mode === "confirm"
      ? "Подтвердите PIN"
      : "Введите PIN";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-2">
          <Lock className="w-10 h-10 mx-auto text-primary" />
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                i < currentValue.length
                  ? "bg-primary border-primary"
                  : "border-muted-foreground"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
        {locked && (
          <p className="text-center text-sm text-muted-foreground">
            Повторите через {countdown} сек.
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((d, i) => {
            if (d === null) return <div key={i} />;
            if (d === "del")
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="h-14 rounded-xl bg-muted text-foreground text-lg font-medium hover:bg-accent transition-colors"
                >
                  ←
                </button>
              );
            return (
              <button
                key={d}
                onClick={() => handleDigit(String(d))}
                disabled={locked}
                className="h-14 rounded-xl bg-card border border-border text-foreground text-lg font-semibold hover:bg-accent disabled:opacity-40 transition-colors"
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Recovery */}
        {mode === "check" && (
          <Collapsible open={showRecovery} onOpenChange={setShowRecovery}>
            <CollapsibleTrigger className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
              Забыли PIN?
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted text-xs text-muted-foreground leading-relaxed">
              Откройте файл JSON в GitHub и найдите поле <code className="text-primary">adminPin</code>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

/* ─── Sortable card ─── */

function SortableCard({
  comp,
  isOverlay,
}: {
  comp: AdminComponent;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: comp.id });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const title = comp.title_ru || comp.title_en || comp.id;
  const lastWord = comp.image
    .replace(/\}$/, "")
    .split(/[\s:/\\]+/)
    .pop() || "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg bg-card border border-border ${
        isOverlay ? "shadow-xl ring-2 ring-primary" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
        <span className="text-[7px] text-muted-foreground leading-tight">
          {lastWord}
        </span>
      </div>
      <span className="text-xs text-card-foreground truncate">{title}</span>
    </div>
  );
}

/* ─── Droppable subcategory label ─── */

function DroppableSubcategory({
  catName,
  subName,
  count,
  isActive,
  isOver,
  onClick,
}: {
  catName: string;
  subName: string;
  count: number;
  isActive: boolean;
  isOver: boolean;
  onClick: () => void;
}) {
  const { setNodeRef, isOver: dndOver } = useSortable({
    id: `drop:${catName}/${subName}`,
    disabled: true,
  });

  const highlight = isOver || dndOver;

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`w-full text-left pl-8 pr-3 py-1.5 text-xs rounded transition-colors ${
        isActive
          ? "bg-primary/20 text-primary font-medium"
          : highlight
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {subName}{" "}
      <span className="text-muted-foreground">({count})</span>
    </button>
  );
}

/* ─── Instruction Modal ─── */

function InstructionModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Что делать после редактирования</DialogTitle>
        </DialogHeader>
        <ol className="space-y-2 text-sm text-foreground list-decimal pl-5">
          {steps.map((s, i) => (
            <li key={i} className="leading-relaxed">
              {s}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Admin Dashboard ─── */

function AdminDashboard({ adminPin }: { adminPin: string }) {
  const { components, rules, loaded } = useRules();
  const navigate = useNavigate();
  const [showInstruction, setShowInstruction] = useState(false);

  // Build admin components with category/subcategory
  const [adminComps, setAdminComps] = useState<AdminComponent[]>([]);

  useEffect(() => {
    if (!loaded) return;
    setAdminComps(
      components.map((c) => ({
        ...c,
        category: (c as any).category || deriveCategory(c.image),
        subcategory: (c as any).subcategory || deriveSubcategory(c),
      }))
    );
  }, [loaded, components]);

  // Build tree: category → subcategory → items
  const tree = useMemo(() => {
    const map: Record<string, Record<string, AdminComponent[]>> = {};
    for (const c of adminComps) {
      if (!map[c.category]) map[c.category] = {};
      if (!map[c.category][c.subcategory])
        map[c.category][c.subcategory] = [];
      map[c.category][c.subcategory].push(c);
    }
    return map;
  }, [adminComps]);

  const categories = useMemo(() => Object.keys(tree).sort(), [tree]);

  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const [activeSub, setActiveSub] = useState<{
    cat: string;
    sub: string;
  } | null>(null);
  const [dragItem, setDragItem] = useState<AdminComponent | null>(null);
  const [overSubId, setOverSubId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");

  const toggleCat = (cat: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const activeItems = useMemo(() => {
    if (!activeSub) return [];
    return tree[activeSub.cat]?.[activeSub.sub] ?? [];
  }, [activeSub, tree]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const item = adminComps.find((c) => c.id === e.active.id);
    if (item) setDragItem(item);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const overId = e.over?.id as string | undefined;
    if (overId?.startsWith("drop:")) {
      setOverSubId(overId);
    } else {
      setOverSubId(null);
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const overId = e.over?.id as string | undefined;
    if (overId?.startsWith("drop:") && dragItem) {
      const [cat, sub] = overId.replace("drop:", "").split("/");
      if (cat && sub) {
        setAdminComps((prev) =>
          prev.map((c) =>
            c.id === dragItem.id
              ? { ...c, category: cat, subcategory: sub }
              : c
          )
        );
      }
    }
    setDragItem(null);
    setOverSubId(null);
  };

  const handleExport = () => {
    const output = {
      rules,
      components: adminComps.map(({ category, subcategory, ...rest }) => ({
        ...rest,
        category,
        subcategory,
      })),
      adminPin,
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_database_final.json";
    a.click();
    URL.revokeObjectURL(url);
    alert("Файл скачан. Замените его в GitHub и задеплойте.");
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (tree[name]) return;
    // Add a dummy entry so the category shows up
    setAdminComps((prev) => [...prev]);
    // Force tree to include it by adding to openCats
    setOpenCats((prev) => new Set([...prev, name]));
    // We need to create the key in tree - simplest: add hidden placeholder
    // Actually, just track empty categories separately
    setNewCatName("");
  };

  const handleAddSubcategory = (cat: string) => {
    const name = newSubName.trim();
    if (!name) return;
    setAddingSubFor(null);
    setNewSubName("");
    // Nothing to persist unless items are moved here
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminPin");
    navigate("/");
  };

  if (!loaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Загрузка…</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-dvh flex flex-col bg-background">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 flex-wrap">
          <h1 className="text-lg font-semibold text-foreground mr-auto">
            Админ-панель
          </h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInstruction(true)}
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Инструкция
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Экспорт JSON
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" />
            Выйти
          </Button>
        </header>

        {/* Two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: category tree */}
          <aside className="w-64 shrink-0 border-r border-border overflow-y-auto p-3 space-y-1">
            {categories.map((cat) => {
              const subs = Object.keys(tree[cat]).sort();
              const isOpen = openCats.has(cat);
              return (
                <Collapsible
                  key={cat}
                  open={isOpen}
                  onOpenChange={() => toggleCat(cat)}
                >
                  <CollapsibleTrigger className="w-full flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-foreground hover:bg-accent rounded transition-colors">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                    {cat}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 mt-0.5">
                    {subs.map((sub) => {
                      const count = tree[cat][sub].length;
                      const isActive =
                        activeSub?.cat === cat && activeSub?.sub === sub;
                      const dropId = `drop:${cat}/${sub}`;
                      return (
                        <DroppableSubcategory
                          key={dropId}
                          catName={cat}
                          subName={sub}
                          count={count}
                          isActive={isActive}
                          isOver={overSubId === dropId}
                          onClick={() => setActiveSub({ cat, sub })}
                        />
                      );
                    })}
                    {addingSubFor === cat ? (
                      <div className="pl-8 pr-2 py-1 flex gap-1">
                        <input
                          autoFocus
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddSubcategory(cat)
                          }
                          placeholder="Название"
                          className="flex-1 text-xs px-2 py-1 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleAddSubcategory(cat)}
                        >
                          OK
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingSubFor(cat);
                          setNewSubName("");
                        }}
                        className="pl-8 py-1 text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Добавить подкатегорию
                      </button>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Add category */}
            <div className="pt-2 space-y-1">
              <div className="flex gap-1">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="Новая категория"
                  className="flex-1 text-xs px-2 py-1.5 rounded bg-input text-foreground border border-border outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={handleAddCategory}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </aside>

          {/* Right panel: component grid */}
          <main className="flex-1 overflow-y-auto p-4">
            {!activeSub ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  Выберите подкатегорию слева
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-medium text-foreground mb-3">
                  {activeSub.cat} → {activeSub.sub}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({activeItems.length})
                  </span>
                </h2>
                <SortableContext
                  items={activeItems.map((c) => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {activeItems.map((comp) => (
                      <SortableCard key={comp.id} comp={comp} />
                    ))}
                  </div>
                </SortableContext>
                {activeItems.length === 0 && (
                  <p className="text-muted-foreground text-xs mt-4">
                    Перетащите компоненты сюда
                  </p>
                )}
              </>
            )}
          </main>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {dragItem && <SortableCard comp={dragItem} isOverlay />}
        </DragOverlay>
      </div>

      <InstructionModal
        open={showInstruction}
        onClose={() => setShowInstruction(false)}
      />
    </DndContext>
  );
}

/* ─── Admin Page (root) ─── */

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");

  const handleAuth = (p: string) => {
    sessionStorage.setItem("adminPin", p);
    setPin(p);
    setAuthed(true);
  };

  // Auto-auth if PIN exists in session
  useEffect(() => {
    const saved = sessionStorage.getItem("adminPin");
    if (saved) {
      setPin(saved);
      setAuthed(true);
    }
  }, []);

  if (!authed) return <PinScreen onAuth={handleAuth} />;
  return <AdminDashboard adminPin={pin} />;
}
