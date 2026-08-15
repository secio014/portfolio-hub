import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"];

function isVideoUrl(url: string) {
  const clean = url.split("?")[0]?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/** Resolves an embed `src` for known social platforms, or null for direct files/images. */
function platformEmbed(url: string): { src: string; vertical: boolean } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "youtu.be") {
    const id =
      host === "youtu.be"
        ? parsed.pathname.slice(1)
        : (parsed.searchParams.get("v") ??
          parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]);
    if (!id) return null;
    return { src: `https://www.youtube.com/embed/${id}`, vertical: false };
  }

  if (host === "tiktok.com") {
    const id = parsed.pathname.match(/\/video\/(\d+)/)?.[1];
    if (!id) return null;
    return { src: `https://www.tiktok.com/embed/v2/${id}`, vertical: true };
  }

  if (host === "instagram.com") {
    const match = parsed.pathname.match(/\/(reel|p|tv)\/([^/?]+)/);
    if (!match) return null;
    return { src: `https://www.instagram.com/${match[1]}/${match[2]}/embed`, vertical: true };
  }

  return null;
}

/** Layout hint carried in the markdown image title, e.g. `![alt](url "left")`. */
type Align = "left" | "right" | "center" | "none";

function alignClass(title: string | undefined, floatable: boolean) {
  const align: Align = title === "left" || title === "right" || title === "center" ? title : "none";
  if (align === "left" && floatable)
    return "float-left mr-4 mb-3 w-full max-w-[45%] sm:max-w-[40%]";
  if (align === "right" && floatable)
    return "float-right ml-4 mb-3 w-full max-w-[45%] sm:max-w-[40%]";
  if (align === "center") return "mx-auto";
  return "w-full";
}

const components: Components = {
  img: ({ src, alt, title }) => {
    if (typeof src !== "string") return null;

    const embed = platformEmbed(src);
    if (embed) {
      return (
        <span
          className={`my-4 block overflow-hidden rounded-md border border-border ${
            embed.vertical ? "aspect-[9/16] max-w-sm" : "aspect-video"
          } ${alignClass(title, true)}`}
        >
          <iframe
            src={embed.src}
            title={alt || "embed"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </span>
      );
    }

    if (isVideoUrl(src)) {
      return (
        <video
          src={src}
          controls
          className={`my-4 rounded-md border border-border ${alignClass(title, true)}`}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        className={`my-4 rounded-md border border-border object-cover ${alignClass(title, true)}`}
      />
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-signal underline underline-offset-2 hover:no-underline"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (!isBlock) {
      return (
        <code
          className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-[0.85em] text-signal"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-md border border-border bg-surface p-4 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  ),
  h1: ({ children }) => <h3 className="mt-6 text-xl font-bold tracking-tight">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-6 text-lg font-bold tracking-tight">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-5 text-base font-bold">{children}</h4>,
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-signal/50 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
};

/** Renders admin-authored markdown (headings, lists, code blocks, video/image embeds). */
export function Markdown({ value }: { value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground after:block after:clear-both after:content-[''] sm:text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {value}
      </ReactMarkdown>
    </div>
  );
}
