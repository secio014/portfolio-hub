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
import { useI18n, type TranslationKey } from "@/lib/i18n";

type Align = "none" | "left" | "center" | "right";

const ALIGN_OPTIONS: { value: Align; labelKey: TranslationKey; icon: typeof Rows3 }[] = [
  { value: "none", labelKey: "admin.media.alignBlock", icon: Rows3 },
  { value: "left", labelKey: "admin.media.alignLeft", icon: AlignHorizontalJustifyStart },
  { value: "center", labelKey: "admin.media.alignCenter", icon: AlignHorizontalJustifyCenter },
  { value: "right", labelKey: "admin.media.alignRight", icon: AlignHorizontalJustifyEnd },
];

const BUCKET = "portfolio";
/** Long-lived: uploaded media is embedded in public markdown, not a short admin preview. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

function storagePath(name: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return `media/${Date.now().toString(36)}-${safe}`;
}

async function uploadAndSign(file: File, urlErrorMessage: string) {
  const path = storagePath(file.name);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data?.signedUrl) throw signError ?? new Error(urlErrorMessage);
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
  const { t } = useI18n();
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
      const signedUrl = await uploadAndSign(file, t("admin.media.urlGenerationFailed"));
      onInsert(markdownFor(signedUrl));
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error((error as { message?: string }).message ?? t("admin.media.uploadFailed"));
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
            {kind === "video" ? t("admin.media.insertVideo") : t("admin.media.insertImage")}
          </DialogTitle>
          <DialogDescription>
            {kind === "video"
              ? t("admin.media.videoDescription")
              : t("admin.media.imageDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <span className="mono-label">{t("admin.media.textPosition")}</span>
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
                {t(option.labelKey)}
              </button>
            ))}
          </div>
          {align === "left" || align === "right" ? (
            <p className="font-mono text-[11px] text-muted-foreground">
              {align === "left"
                ? t("admin.media.textFlowsRight")
                : t("admin.media.textFlowsLeft")}
            </p>
          ) : null}
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as "url" | "upload")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="font-mono text-xs">
              <LinkIcon className="mr-1.5 size-3.5" /> {t("admin.media.link")}
            </TabsTrigger>
            <TabsTrigger value="upload" className="font-mono text-xs">
              <Upload className="mr-1.5 size-3.5" /> {t("admin.media.uploadFile")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-3">
            <Input
              autoFocus
              value={url}
              placeholder={
                kind === "video" ? "https://youtube.com/watch?v=..." : t("admin.media.imagePlaceholder")
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
              {t("admin.media.insert")}
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
              {uploading
                ? t("admin.media.uploading")
                : kind === "video"
                  ? t("admin.media.chooseVideo")
                  : t("admin.media.chooseImage")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
