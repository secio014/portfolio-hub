import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, EmptyState, PanelHeader, type Row } from "./kit";

export function MessagesPanel() {
  const queryClient = useQueryClient();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: messages = [] } = useQuery<Row[]>({
    queryKey: ["admin", "contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function mutate(action: Promise<{ error: unknown }>) {
    await action;
    void queryClient.invalidateQueries({ queryKey: ["admin", "contact_messages"] });
  }

  return (
    <div className="space-y-4">
      <PanelHeader title="contact_messages" hint={`${messages.length} recebida(s)`} />
      {messages.length === 0 ? <EmptyState label="Caixa de entrada vazia." /> : null}
      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={String(message["id"])} className="panel panel-glow p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-signal">
                {String(message["name"])} · {String(message["email"])}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 font-mono text-[11px]"
                  onClick={() =>
                    void mutate(
                      supabase
                        .from("contact_messages")
                        .update({ read: !message["read"] })
                        .eq("id", String(message["id"])) as unknown as Promise<{ error: unknown }>,
                    )
                  }
                >
                  {message["read"] ? "marcar como não lida" : "marcar como lida"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 font-mono text-[11px] text-destructive"
                  onClick={() => setPendingDeleteId(String(message["id"]))}
                >
                  excluir
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{String(message["message"])}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {new Date(String(message["created_at"])).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Excluir esta mensagem?"
        description="Esta ação não pode ser desfeita."
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          void mutate(
            supabase
              .from("contact_messages")
              .delete()
              .eq("id", pendingDeleteId) as unknown as Promise<{ error: unknown }>,
          );
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
