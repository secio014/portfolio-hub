import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, Search, Upload } from "lucide-react";
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
import { searchGifs } from "@/lib/giphy.functions";
import { useI18n } from "@/lib/i18n";

const BUCKET = "portfolio";

function avatarPath(name: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return `avatar/${Date.now().toString(36)}-${safe}`;
}

async function uploadAvatar(file: File) {
  const path = avatarPath(file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

type GifResult = { id: string; preview: string; full: string };

/** Lets the admin set the site avatar by uploading a file or picking a GIF, instead of typing a raw URL. */
export function AvatarPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"upload" | "gif">("upload");
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GifResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      onSelect(url);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as { message?: string }).message ?? t("admin.avatar.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { results: gifs } = await searchGifs({ data: { query: query.trim() } });
      setResults(gifs);
    } catch (error) {
      toast.error((error as { message?: string }).message ?? t("admin.avatar.searchFailed"));
    } finally {
      setSearching(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{t("admin.avatar.title")}</DialogTitle>
          <DialogDescription>{t("admin.avatar.description")}</DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(value) => setMode(value as "upload" | "gif")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="font-mono text-xs">
              <Paperclip className="mr-1.5 size-3.5" /> {t("admin.avatar.attachFile")}
            </TabsTrigger>
            <TabsTrigger value="gif" className="font-mono text-xs">
              <Search className="mr-1.5 size-3.5" /> {t("admin.avatar.searchGif")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
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
              <Upload className="size-3.5" />{" "}
              {uploading ? t("admin.avatar.uploading") : t("admin.avatar.chooseImage")}
            </Button>
          </TabsContent>

          <TabsContent value="gif" className="space-y-3">
            <div className="flex gap-1.5">
              <Input
                autoFocus
                value={query}
                placeholder={t("admin.avatar.searchPlaceholder")}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearch();
                  }
                }}
                className="h-9 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                disabled={searching || !query.trim()}
                className="h-9 shrink-0 font-mono text-xs"
                onClick={() => void handleSearch()}
              >
                {searching ? "…" : t("admin.avatar.search")}
              </Button>
            </div>
            {results.length ? (
              <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto">
                {results.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSelect(gif.full);
                      onOpenChange(false);
                    }}
                    className="overflow-hidden rounded-md border border-border transition-colors hover:border-signal"
                  >
                    <img src={gif.preview} alt="" className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[11px] text-muted-foreground">
                {t("admin.avatar.searchHintBefore")}{" "}
                <code className="rounded-sm bg-muted px-1 py-0.5">GIPHY_API_KEY</code>{" "}
                {t("admin.avatar.searchHintAfter")}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
