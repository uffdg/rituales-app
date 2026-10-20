import type { ComponentProps } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

// Menú de acciones del design system (spec 03). Basado en Radix por el foco,
// las flechas del teclado y el cierre al tocar afuera.

const cx = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 4, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cx(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 z-[140] min-w-[160px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-sm border border-line-soft bg-surface-base p-1.5 shadow-lifted",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: "default" | "danger" }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cx(
        "relative flex cursor-pointer items-center gap-2 rounded-xs px-3 py-2.5 font-sans text-body outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:shrink-0",
        variant === "danger"
          ? "text-danger focus:bg-danger-surface"
          : "text-ink-strong focus:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cx("-mx-1.5 my-1 h-px bg-line-soft", className)} {...props} />;
}
