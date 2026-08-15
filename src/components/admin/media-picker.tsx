import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Link as LinkIcon,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  Rows3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Align = "none" | "left" | "center" | "right";

const ALIGN_OPTIONS: { value: Align; label: string; icon: typeof Rows3 }[] = [
  { value: "none", label: "Bloco", icon: Rows3 },
  { value: "left", label: "Esquerda", icon: AlignHorizontalJustifyStart },
  { value: "center", label: "Centro", icon: AlignHorizontalJustifyCenter },
  { value: "right", label: "Direita", icon: AlignHorizontalJustifyEnd },
];

const BUCKET = "portfolio";
/** Long-lived: uploaded media is embedded in public markdown, not a short admin preview. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

function storagePath(name: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return `media/${Date.now().toString(36)}-${safe}`;
}

async function uploadAndSign(file: File) {
  const path = storagePath(file.name);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Falha ao gerar URL");
  return data.signedUrl;
}

export function MediaPickerDialog({
  open,
  kind,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  kind: "image" | "video";
  onOpenChange: (open: boolean) => void;
  onInsert: (markdown: string) => void;
}) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("");
  const [align, setAlign] = useState<Align>("none");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setUrl("");
    setAlign("none");
    setMode("url");
  }

  function markdownFor(src: string) {
    return align === "none" ? `\n![${kind}](${src})\n` : `\n![${kind}](${src} "${align}")\n`;
  }

  function insertUrl() {
    if (!url.trim()) return;
    onInsert(markdownFor(url.trim()));
    onOpenChange(false);
    reset();
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const signedUrl = await uploadAndSign(file);
      onInsert(markdownFor(signedUrl));
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error((error as { message?: string }).message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            {kind === "video" ? "Inserir vídeo" : "Inserir imagem"}
          </DialogTitle>
          <DialogDescription>
            {kind === "video"
              ? "Cole um link do YouTube, TikTok ou Instagram, um link direto (.mp4/.webm), ou envie um arquivo."
              : "Cole o link de uma imagem ou envie um arquivo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <span className="mono-label">Posição no texto</span>
          <div className="grid grid-cols-4 gap-1.5">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAlign(option.value)}
                className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 font-mono text-[10px] uppercase transition-colors ${
                  align === option.value
                    ? "border-signal bg-signal/10 text-signal"
                    : "border-border text-muted-foreground hover:border-signal/40 hover:text-foreground"
                }`}
              >
                <option.icon className="size-4" />
                {option.label}
              </button>
            ))}
          </div>
          {align === "left" || align === "right" ? (
            <p className="font-mono text-[11px] text-muted-foreground">
              O texto ao redor flui ao lado {align === "left" ? "direito" : "esquerdo"}.
            </p>
          ) : null}
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as "url" | "upload")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="font-mono text-xs">
              <LinkIcon className="mr-1.5 size-3.5" /> Link
            </TabsTrigger>
            <TabsTrigger value="upload" className="font-mono text-xs">
              <Upload className="mr-1.5 size-3.5" /> Enviar arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-3">
            <Input
              autoFocus
              value={url}
              placeholder={
                kind === "video" ? "https://youtube.com/watch?v=..." : "https://.../imagem.jpg"
              }
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  insertUrl();
                }
              }}
              className="h-10 font-mono text-xs"
            />
            <Button
              type="button"
              className="h-9 w-full font-mono text-xs"
              onClick={insertUrl}
              disabled={!url.trim()}
            >
              Inserir
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept={kind === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="h-9 w-full font-mono text-xs"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-3.5" />
              {uploading ? "Enviando…" : kind === "video" ? "Escolher vídeo" : "Escolher imagem"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
