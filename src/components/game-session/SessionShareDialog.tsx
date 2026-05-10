import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/context/LanguageContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
}

export default function SessionShareDialog({ open, onOpenChange, url }: Props) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(lang === "RU" ? "Ссылка скопирована" : "Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(lang === "RU" ? "Не удалось скопировать" : "Copy failed");
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lang === "RU" ? "Поделиться партией" : "Share game session"}
          </DialogTitle>
          <DialogDescription>
            {lang === "RU"
              ? "Отправьте ссылку или QR-код другим игрокам. Партия доступна 24 часа."
              : "Send the link or QR code to the other players. Session is valid for 24 hours."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div className="rounded-md bg-white p-3">
            <img
              src={qrSrc}
              alt={lang === "RU" ? "QR-код партии" : "Session QR code"}
              width={240}
              height={240}
              className="block"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 font-mono text-xs"
          />
          <Button onClick={handleCopy} variant="default" size="sm">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied
              ? lang === "RU"
                ? "Готово"
                : "Copied"
              : lang === "RU"
                ? "Копировать"
                : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
