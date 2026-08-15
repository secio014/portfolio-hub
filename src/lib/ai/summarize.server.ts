const MODEL = "@cf/meta/llama-3.1-8b-instruct";

export type ProjectSummary = { en: string; pt: string; es: string };

type WorkersAiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<{ response?: string }>;
};

/**
 * Cloudflare Workers AI bindings aren't env vars — nitro's cloudflare-module
 * preset stashes the raw Workers `env` object (bindings included) on
 * `globalThis.__env__` for every request. Only populated when actually
 * running inside a Worker (deployed, or `wrangler dev`) — plain `vite dev`
 * has no Workers runtime, so this is undefined there.
 */
function getAiBinding(): WorkersAiBinding | undefined {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  return env?.["AI"] as WorkersAiBinding | undefined;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1]! : text;
  return JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
}

/**
 * Uses Cloudflare Workers AI (free tier, no separate API key) to produce a
 * one-sentence, plain-language "what this project does" summary in en/pt/es.
 * Server-only — never import from client code.
 */
export async function generateSummaryText(input: {
  title: string;
  description: string;
  tech: string[];
}): Promise<ProjectSummary> {
  const ai = getAiBinding();
  if (!ai) {
    throw new Error(
      "Workers AI binding not available — run via `wrangler dev` or a deployed preview (plain `vite dev` has no Cloudflare runtime).",
    );
  }

  const result = await ai.run(MODEL, {
    messages: [
      {
        role: "system",
        content:
          'You write a single short, plain-language sentence (max ~160 characters, no markdown, no quotes around it) summarizing what a software project does, for a portfolio site\'s project card. Respond with strict JSON only, no prose before or after: {"en": "...", "pt": "...", "es": "..."} with the same sentence translated to English, Brazilian Portuguese and Spanish.',
      },
      {
        role: "user",
        content: `Project title: ${input.title || "Untitled"}\nExisting description (may be empty or in any language): ${input.description || "(none)"}\nTech stack: ${input.tech.join(", ") || "(unknown)"}`,
      },
    ],
    max_tokens: 400,
  });

  const text = result.response ?? "";
  const parsed = extractJson(text) as Partial<ProjectSummary>;

  if (!parsed.en || !parsed.pt || !parsed.es) {
    throw new Error("Workers AI response did not include en/pt/es summary text.");
  }

  return { en: parsed.en, pt: parsed.pt, es: parsed.es };
}
