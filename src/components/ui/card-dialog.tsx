import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared dialog content for card popups (artifacts, spells, abilities, events,
 * astrologers, war machines, statistics/battle cards, map fields, units).
 *
 * - Consistent width with margins on all 4 sides (w-[95vw] max-w-sm)
 * - Replaces the default X close button with a golden circular one
 *   placed at the top-right INSIDE the dialog bounds.
 * - Optional onPrev/onNext for swipe + arrow-button navigation between cards.
 *
 * Heroes and Cities dialogs intentionally do NOT use this component.
 */
interface CardDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  onPrev?: () => void;
  onNext?: () => void;
}

const CardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  CardDialogContentProps
>(({ className, children, onPrev, onNext, ...props }, ref) => {
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Ignore mostly-vertical gestures so vertical scroll isn't interfered with.
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 0) onPrev?.();
    else onNext?.();
  };

  const arrowBase =
    "absolute top-1/2 -translate-y-1/2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background/80 backdrop-blur-sm text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background";

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        ref={ref}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-sm max-h-[90dvh] translate-x-[-50%] translate-y-[-50%]",
          "flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg p-0",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <button
          type="button"
          aria-label="Previous"
          onClick={onPrev}
          className={cn(arrowBase, "left-2", !onPrev && "opacity-30 pointer-events-none")}
          style={{ borderColor: "#E1BB3A", color: "#E1BB3A" }}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={onNext}
          className={cn(arrowBase, "right-2", !onNext && "opacity-30 pointer-events-none")}
          style={{ borderColor: "#E1BB3A", color: "#E1BB3A" }}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background/80 backdrop-blur-sm text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
          style={{ borderColor: "#E1BB3A", color: "#E1BB3A" }}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
CardDialogContent.displayName = "CardDialogContent";

export { CardDialogContent };
