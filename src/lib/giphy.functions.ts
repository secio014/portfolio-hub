import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GIPHY_API = "https://api.giphy.com/v1/gifs/search";

const schema = z.object({ query: z.string().min(1) });

type GiphyResponse = {
  data: {
    id: string;
    images: {
      fixed_height_small: { url: string };
      original: { url: string };
    };
  }[];
};

/**
 * Searches Giphy for the admin's "avatar" picker, proxied through the server
 * so the API key is never sent to the client. Admin-only.
 */
export const searchGifs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    const apiKey = process.env["GIPHY_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "GIPHY_API_KEY não configurado no servidor — adicione essa variável de ambiente para habilitar a busca de GIFs.",
      );
    }

    const url = `${GIPHY_API}?api_key=${apiKey}&q=${encodeURIComponent(data.query)}&limit=15&rating=g`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Busca no Giphy falhou (${res.status})`);
    const json = (await res.json()) as GiphyResponse;

    return {
      results: json.data.map((gif) => ({
        id: gif.id,
        preview: gif.images.fixed_height_small.url,
        full: gif.images.original.url,
      })),
    };
  });
