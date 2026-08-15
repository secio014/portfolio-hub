import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapAdmin } from "@/lib/admin.functions";
import { AdminSidebar, useAdminNav, type ActiveLeaf } from "@/components/admin/admin-sidebar";
import { ThemeLangControls } from "@/components/site/theme-lang-controls";
import { useI18n } from "@/lib/i18n";

const IDLE_LIMIT_MS = 30 * 60 * 1000;

/** Signs the admin out after 30 minutes with no mouse/keyboard/touch activity. */
function useIdleLogout() {
  const { t } = useI18n();
  useEffect(() => {
    let lastActivity = Date.now();
    const markActive = () => {
      lastActivity = Date.now();
    };
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
        void supabase.auth.signOut();
        toast.info(t("admin.idleSignOut"));
      }
    }, 15_000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, markActive));
      clearInterval(interval);
    };
  }, [t]);
}

export const Route = createFileRoute("/$adminPath")({
  head: ({ params }) =>
    params.adminPath === import.meta.env.VITE_ADMIN_PATH
      ? {
          meta: [
            { title: "Admin" },
            { name: "robots", content: "noindex, nofollow" },
            { name: "description", content: "Área privada." },
          ],
        }
      : { meta: [{ title: "404 — Page not found" }] },
  component: AdminPage,
});

/** Only matches when the URL segment equals the secret path from VITE_ADMIN_PATH — every other value renders 404. */
function AdminPage() {
  const { adminPath } = Route.useParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setIsAdmin(true);
        return;
      }
      try {
        const result = await bootstrapAdmin();
        setIsAdmin(Boolean(result?.ok));
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [userId]);

  if (adminPath !== import.meta.env.VITE_ADMIN_PATH) {
    return <NotAuthorized />;
  }

  if (checking) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!userId) return <AdminLogin />;
  if (!isAdmin) return <NotAuthorized />;

  return <AdminDashboard />;
}

function NotAuthorized() {
  const { t } = useI18n();
  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center px-4">
      <ThemeLangControls className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <div className="max-w-sm text-center">
        <h1 className="font-mono text-7xl font-bold">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("notFound.title")}</p>
        <Button asChild variant="ghost" className="mt-5 font-mono text-xs">
          <a href="/">{t("notFound.goHome")}</a>
        </Button>
      </div>
    </div>
  );
}

function AdminLogin() {
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    setPending(false);
    if (error) toast.error(t("admin.invalidCredentials"));
  }

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center bg-background px-4">
      <ThemeLangControls className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <form onSubmit={handleSubmit} className="panel panel-glow w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-signal" />
          <h1 className="font-mono text-sm font-semibold">{t("admin.restricted")}</h1>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="mono-label">
            {t("admin.email")}
          </Label>
          <Input id="email" name="email" type="email" required className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="mono-label">
            {t("admin.password")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={pending} className="h-11 w-full font-mono text-xs">
          {pending ? t("admin.processing") : t("admin.enter")}
        </Button>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const { t } = useI18n();
  const [active, setActive] = useState<ActiveLeaf>({ group: "home", item: "sections" });
  useIdleLogout();
  const { groups, loading } = useAdminNav((slug) => setActive({ group: slug, item: "sections" }));
  const activeGroup = groups.find((group) => group.id === active.group) ?? groups[0];
  const activeLeaf =
    activeGroup?.items.find((item) => item.id === active.item) ?? activeGroup?.items[0];

  return (
    <div className="grid-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-5">
          <h1 className="font-mono text-lg font-bold">
            <span className="text-signal">~/</span>admin
            <span className="caret ml-0.5 h-4 align-middle" aria-hidden />
          </h1>
          <div className="flex items-center gap-2">
            <ThemeLangControls />
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="size-3.5" /> {t("admin.signOut")}
            </Button>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <AdminSidebar groups={groups} active={active} onSelect={setActive} />
          <main className="min-w-0 flex-1">
            {loading ? null : activeLeaf ? activeLeaf.render() : null}
          </main>
        </div>
      </div>
    </div>
  );
}
