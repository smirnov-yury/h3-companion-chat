import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onSave: (key: string) => void;
}

export default function ApiKeyModal({ open, onSave }: Props) {
  const [value, setValue] = useState("");

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Groq API Key</DialogTitle>
          <DialogDescription>
            Enter your Groq API key to use the AI Game Master. You can get one at{" "}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline text-primary">
              console.groq.com
            </a>
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = value.trim();
            if (trimmed) onSave(trimmed);
          }}
          className="flex flex-col gap-3"
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="gsk_..."
            type="password"
            autoFocus
          />
          <Button type="submit" disabled={!value.trim()}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
