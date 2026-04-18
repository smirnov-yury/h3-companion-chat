import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared dialog content for card popups (artifacts, spells, abilities, events,
 * astrologers, war machines, statistics/battle cards, map fields, units).
 *
 * - Consistent width with margins on all 4 sides (w-[95vw] max-w-sm)
 * - Replaces the default X close button with a golden circular one
 *   placed at the top-right INSIDE the dialog bounds.
 *
 * Heroes and Cities dialogs intentionally do NOT use this component.
 */
const CardDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-sm max-h-[90dvh] translate-x-[-50%] translate-y-[-50%]",
        "flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg p-0",
        "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        className="absolute top-3 right-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background/80 backdrop-blur-sm text-foreground transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
        style={{ borderColor: "#E1BB3A", color: "#E1BB3A" }}
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CardDialogContent.displayName = "CardDialogContent";

export { CardDialogContent };
