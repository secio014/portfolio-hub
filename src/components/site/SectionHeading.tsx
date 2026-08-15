export function SectionHeading({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8 sm:mb-10">
      <span className="section-eyebrow">
        {index} <span className="text-muted-foreground">// {title.toLowerCase()}</span>
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      ) : null}
      <div className="mt-5 h-px w-full bg-gradient-to-r from-signal/60 via-border to-transparent" />
    </header>
  );
}
