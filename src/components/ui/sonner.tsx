import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-lg group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:bg-card group-[.toaster]:font-mono group-[.toaster]:text-xs group-[.toaster]:text-foreground group-[.toaster]:shadow-[var(--shadow-panel)]",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-md group-[.toast]:bg-signal group-[.toast]:text-signal-foreground group-[.toast]:font-mono group-[.toast]:text-[11px]",
          cancelButton:
            "group-[.toast]:rounded-md group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-mono group-[.toast]:text-[11px]",
          success: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-signal",
          error: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-destructive",
          warning: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-warn",
          info: "group-[.toaster]:border-l-2 group-[.toaster]:border-l-chart-2",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
