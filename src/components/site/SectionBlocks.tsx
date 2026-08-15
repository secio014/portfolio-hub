import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Markdown } from "@/components/site/Markdown";
import { localized, type Locale } from "@/lib/i18n";

type Block = { id: string; title: unknown; body: unknown };

function BlockCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel panel-glow h-full p-4 sm:p-5">
      {title ? <h3 className="font-mono text-sm font-semibold">{title}</h3> : null}
      <div className={title ? "prose-content mt-2 text-sm" : "prose-content text-sm"}>
        <Markdown value={body} />
      </div>
    </div>
  );
}

/**
 * Renders a section's "divs" (repeatable sub-blocks) in the layout the
 * admin picked: stacked, an auto-fit grid (column count follows the
 * container width, no manual count needed), or a swipeable carousel.
 */
export function SectionBlocks({
  blocks,
  layout,
  locale,
}: {
  blocks: Block[];
  layout: string;
  locale: Locale;
}) {
  if (!blocks.length) return null;

  if (layout === "horizontal") {
    return (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            title={localized(block.title, locale)}
            body={localized(block.body, locale)}
          />
        ))}
      </div>
    );
  }

  if (layout === "carousel") {
    return (
      <Carousel opts={{ align: "start" }} className="px-1">
        <CarouselContent>
          {blocks.map((block) => (
            <CarouselItem key={block.id} className="sm:basis-1/2 lg:basis-1/3">
              <BlockCard
                title={localized(block.title, locale)}
                body={localized(block.body, locale)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {blocks.length > 1 ? (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        ) : null}
      </Carousel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => (
        <BlockCard
          key={block.id}
          title={localized(block.title, locale)}
          body={localized(block.body, locale)}
        />
      ))}
    </div>
  );
}
