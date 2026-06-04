import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PwaBumpButton() {
  const [arming, setArming] = useState(false);
  const [bumping, setBumping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disarm = useCallback(() => {
    setArming(false);
  }, []);

  const bump = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setArming(false);
    setBumping(true);
    try {
      const { data, error } = await (supabase.rpc as any)("bump_pwa_refresh_version");
      if (error) throw error;
      const result = data as { ok: boolean; new_version: number } | null;
      if (result?.ok) {
        toast.success(`Refresh version bumped to ${result.new_version}. All open tabs will see the banner within 5 min.`);
      } else {
        toast.error("Bump returned unexpected payload");
      }
    } catch (e) {
      toast.error(`Bump failed: ${(e as Error).message}`);
    } finally {
      setBumping(false);
    }
  };

  const handleClick = () => {
    if (bumping) return;
    if (arming) {
      bump();
      return;
    }
    setArming(true);
    timeoutRef.current = setTimeout(() => {
      setArming(false);
      timeoutRef.current = null;
    }, 5000);
  };

  const label = bumping
    ? "Pushing…"
    : arming
    ? "Confirm push?"
    : "Push refresh to users";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={bumping}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm border transition-colors disabled:opacity-50 ${
          arming
            ? "border-amber-500 text-amber-600 hover:bg-amber-500/10"
            : "border-border bg-background text-foreground hover:bg-accent"
        }`}
      >
        {bumping ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        {label}
      </button>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        Forces the update banner in all open user tabs within ~5 min
      </span>
    </div>
  );
}
