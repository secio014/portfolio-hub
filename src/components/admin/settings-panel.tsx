import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Paperclip, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getGithubSyncStatus, syncGithubData } from "@/lib/github-sync.functions";
import { Button } from "@/components/ui/button";
import { AdminCard, PanelHeader, SaveBar, TextField, type Row } from "./kit";
import { TechStackPicker } from "./tech-stack-picker";
import { SecurityPanel } from "./security-panel";
import { AvatarPickerDialog } from "./avatar-picker";

/** Accepts a bare handle or a pasted github.com URL and returns just the handle. */
function sanitizeGithubHandle(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s?#]+)/i);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed.replace(/^@/, "");
}

export function useSiteSettings() {
  return useQuery<Row>({
    queryKey: ["admin", "site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).single();
      if (error) throw error;
      return data as Row;
    },
  });
}

function useSaveSettings() {
  const queryClient = useQueryClient();
  return async (id: string, values: Row) => {
    const { error } = await supabase
      .from("site_settings")
      .update(values as never)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Salvo");
    void queryClient.invalidateQueries({ queryKey: ["admin", "site_settings"] });
    void queryClient.invalidateQueries({ queryKey: ["site_settings"] });
  };
}

export function SettingsPanel() {
  const { data: settings } = useSiteSettings();
  const save = useSaveSettings();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Row>({});
  const [syncing, setSyncing] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const { data: githubStatus } = useQuery({
    queryKey: ["admin", "github_sync_status"],
    queryFn: () => getGithubSyncStatus(),
  });

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (!settings) return null;

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncGithubData();
      toast.success(`${result.reposSynced} repositório(s) sincronizado(s)`);
      if (result.warning) toast.warning(result.warning);
      void queryClient.invalidateQueries({ queryKey: ["github_repos_cache"] });
      void queryClient.invalidateQueries({ queryKey: ["github_activity_cache"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao sincronizar com o GitHub");
    } finally {
      setSyncing(false);
    }
  }

  const set = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));
  const stack = Array.isArray(draft["tech_stack"]) ? (draft["tech_stack"] as string[]) : [];
  const metrics = (draft["metrics"] as Row) ?? {};

  return (
    <div className="space-y-4">
      <PanelHeader
        title="site_settings"
        hint="Identidade, links sociais e métricas da página inicial."
      />
      <AdminCard>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nome do proprietário"
            value={String(draft["owner_name"] ?? "")}
            onChange={(value) => set("owner_name", value)}
          />
          <TextField
            label="E-mail"
            value={String(draft["email"] ?? "")}
            onChange={(value) => set("email", value)}
          />
          <TextField
            label="Usuário do GitHub"
            value={String(draft["github_username"] ?? "")}
            onChange={(value) => set("github_username", value)}
          />
          <TextField
            label="Organização do GitHub"
            value={String(draft["github_org"] ?? "")}
            onChange={(value) => set("github_org", value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <p className="font-mono text-[11px] text-muted-foreground">
            Puxa repositórios públicos e atividade de contribuição do GitHub para os blocos da home.
            Salve o usuário/organização acima antes de sincronizar.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 shrink-0 font-mono text-xs"
            disabled={syncing}
            onClick={() => void handleSync()}
          >
            <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando…" : "Sincronizar GitHub"}
          </Button>
        </div>

        {githubStatus && !githubStatus.hasToken ? (
          <div className="flex items-start gap-2.5 rounded-md border border-warn/40 bg-warn/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
            <div className="space-y-1">
              <p className="font-mono text-[11px] font-semibold text-warn">
                GITHUB_TOKEN não configurado no servidor
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                Sem o token, a sincronização ainda busca repositórios públicos (com limite de taxa
                mais baixo), mas o gráfico de contribuições fica vazio — ele exige a API GraphQL
                autenticada do GitHub. Gere um personal access token e adicione{" "}
                <code className="rounded-sm bg-muted px-1 py-0.5">GITHUB_TOKEN</code> nas variáveis
                de ambiente do servidor (.env local e/ou painel de deploy), depois reinicie o
                servidor.
              </p>
            </div>
          </div>
        ) : null}
        {githubStatus?.hasToken && !githubStatus.username ? (
          <div className="flex items-start gap-2.5 rounded-md border border-warn/40 bg-warn/10 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
            <p className="font-mono text-[11px] text-muted-foreground">
              Defina o "Usuário do GitHub" acima e salve antes de sincronizar.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="URL do LinkedIn"
            value={String(draft["linkedin_url"] ?? "")}
            onChange={(value) => set("linkedin_url", value)}
          />
          <div className="space-y-1.5">
            <TextField
              label="URL do avatar"
              value={String(draft["avatar_url"] ?? "")}
              onChange={(value) => set("avatar_url", value)}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 font-mono text-[11px]"
                onClick={() => setAvatarPickerOpen(true)}
              >
                <Paperclip className="size-3" /> Anexar arquivo ou buscar GIF
              </Button>
              {draft["avatar_url"] ? (
                <img
                  src={String(draft["avatar_url"])}
                  alt=""
                  className="size-8 shrink-0 rounded-full border border-border object-cover"
                />
              ) : null}
            </div>
          </div>
        </div>

        <AvatarPickerDialog
          open={avatarPickerOpen}
          onOpenChange={setAvatarPickerOpen}
          onSelect={(url) => set("avatar_url", url)}
        />

        <TechStackPicker value={stack} onChange={(next) => set("tech_stack", next)} />

        <div className="grid gap-4 sm:grid-cols-3">
          {["projects", "technologies", "years"].map((key) => (
            <TextField
              key={key}
              label={`Métrica · ${key}`}
              type="number"
              value={String(metrics[key] ?? "")}
              onChange={(value) => set("metrics", { ...metrics, [key]: Number(value) || 0 })}
            />
          ))}
        </div>

        <SaveBar
          onSave={() =>
            void save(String(settings["id"]), {
              owner_name: draft["owner_name"] ?? "",
              email: draft["email"] || null,
              github_username: draft["github_username"]
                ? sanitizeGithubHandle(String(draft["github_username"]))
                : null,
              github_org: draft["github_org"]
                ? sanitizeGithubHandle(String(draft["github_org"]))
                : null,
              linkedin_url: draft["linkedin_url"] || null,
              avatar_url: draft["avatar_url"] || null,
              tech_stack: stack,
              metrics,
            })
          }
        />
      </AdminCard>
      <SecurityPanel />
    </div>
  );
}
