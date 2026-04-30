import { useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, BookOpen, Map, Zap, Layers, Users, Crown,
  Building2, FileText, ListFilter, ScrollText, LogOut, Menu, X,
  ChevronDown, ChevronRight,
} from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import RulesEditor from "@/components/admin/RulesEditor";

const NAV_ITEMS: Array<
  | { path: string; label: string; icon: React.ElementType }
  | { label: string; icon: React.ElementType; children: { path: string; label: string }[] }
> = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "rules", label: "Rules", icon: BookOpen },
  { path: "scenarios", label: "Scenarios", icon: Map },
  { path: "map-elements", label: "Map Elements", icon: Map },
  {
    label: "Global Events", icon: Zap,
    children: [
      { path: "events", label: "Events" },
      { path: "astrologers", label: "Astrologers" },
    ],
  },
  {
    label: "Decks", icon: Layers,
    children: [
      { path: "artifacts", label: "Artifacts" },
      { path: "spells", label: "Spells" },
      { path: "abilities", label: "Abilities" },
      { path: "attributes", label: "Attributes" },
      { path: "war-machines", label: "War Machines" },
    ],
  },
  { path: "units", label: "Units", icon: Users },
  { path: "heroes", label: "Heroes", icon: Crown },
  { path: "towns", label: "Towns", icon: Building2 },
  { path: "about-page", label: "About Page", icon: FileText },
  { path: "filter-groups", label: "Filter Groups", icon: ListFilter },
  { path: "audit-log", label: "Audit Log", icon: ScrollText },
];

function SidebarLink({ path, label, icon: Icon, onNavigate }: { path: string; label: string; icon?: React.ElementType; onNavigate?: () => void }) {
  return (
    <NavLink
      to={path}
      end={path === ""}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`
      }
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </NavLink>
  );
}

function SidebarGroup({ label, icon: Icon, children, onNavigate }: { label: string; icon: React.ElementType; children: { path: string; label: string }[]; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" />
          {label}
        </span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && (
        <div className="ml-6 mt-1 space-y-0.5">
          {children.map((c) => (
            <NavLink
              key={c.path}
              to={c.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/dragonutopia/login");
  };

  const closeMobile = () => setSidebarOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <span className="text-base font-semibold text-foreground">HMM3 Admin</span>
        <button
          type="button"
          onClick={closeMobile}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map((item, i) =>
          "children" in item ? (
            <SidebarGroup key={i} label={item.label} icon={item.icon} children={item.children} onNavigate={closeMobile} />
          ) : (
            <SidebarLink key={i} path={item.path} label={item.label} icon={item.icon} onNavigate={closeMobile} />
          )
        )}
      </nav>
      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden lg:flex w-64 border-r border-border flex-col">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={closeMobile} />
          <aside className="relative w-64 bg-background border-r border-border flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold">HMM3 Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="rules" element={<RulesEditor />} />
            <Route path="scenarios" element={<p className="text-muted-foreground">Scenarios editor — coming soon</p>} />
            <Route path="map-elements" element={<p className="text-muted-foreground">Map Elements editor — coming soon</p>} />
            <Route path="events" element={<p className="text-muted-foreground">Events editor — coming soon</p>} />
            <Route path="astrologers" element={<p className="text-muted-foreground">Astrologers editor — coming soon</p>} />
            <Route path="artifacts" element={<p className="text-muted-foreground">Artifacts editor — coming soon</p>} />
            <Route path="spells" element={<p className="text-muted-foreground">Spells editor — coming soon</p>} />
            <Route path="abilities" element={<p className="text-muted-foreground">Abilities editor — coming soon</p>} />
            <Route path="attributes" element={<p className="text-muted-foreground">Attributes editor — coming soon</p>} />
            <Route path="war-machines" element={<p className="text-muted-foreground">War Machines editor — coming soon</p>} />
            <Route path="units" element={<p className="text-muted-foreground">Units editor — coming soon</p>} />
            <Route path="heroes" element={<p className="text-muted-foreground">Heroes editor — coming soon</p>} />
            <Route path="towns" element={<p className="text-muted-foreground">Towns editor — coming soon</p>} />
            <Route path="about-page" element={<p className="text-muted-foreground">About Page editor — coming soon</p>} />
            <Route path="filter-groups" element={<p className="text-muted-foreground">Filter Groups editor — coming soon</p>} />
            <Route path="audit-log" element={<p className="text-muted-foreground">Audit Log — coming soon</p>} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
