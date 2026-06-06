import {
  BookOpen, Map, MapPin, CalendarDays, Layers, Swords, User, Castle,
  MessageCircle, Wand2, type LucideIcon,
} from "lucide-react";

export type TabId =
  | "rules" | "scenarios" | "map_elements" | "global_events" | "decks"
  | "units" | "heroes" | "towns" | "ai" | "game_setup" | "guide";

export const navItems: { id: TabId; labelRU: string; labelEN: string; icon: LucideIcon }[] = [
  { id: "rules",         labelRU: "Правила",            labelEN: "Rules",           icon: BookOpen },
  { id: "scenarios",     labelRU: "Сценарии",           labelEN: "Scenarios",       icon: Map },
  { id: "map_elements",  labelRU: "Элементы карты",     labelEN: "Map Elements",    icon: MapPin },
  { id: "global_events", labelRU: "Глобальные события", labelEN: "Global Events",   icon: CalendarDays },
  { id: "decks",         labelRU: "Колоды",             labelEN: "Decks",           icon: Layers },
  { id: "units",         labelRU: "Юниты",              labelEN: "Units",           icon: Swords },
  { id: "heroes",        labelRU: "Герои",              labelEN: "Heroes",          icon: User },
  { id: "towns",         labelRU: "Города",             labelEN: "Towns",           icon: Castle },
  { id: "ai",            labelRU: "ИИ Мастер игры",     labelEN: "AI Game Master",  icon: MessageCircle },
  { id: "game_setup",    labelRU: "Подготовка партии",  labelEN: "Game Setup",      icon: Wand2 },
];
