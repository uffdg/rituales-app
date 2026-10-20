import type { ComponentProps } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

// Diálogo de confirmación del design system (spec 03): panel blanco, título
// serif, acciones con editorial-button. Basado en Radix por el foco y el Escape.

const cx = (...classes: Array<string | undefined>) => classes.filter(Boolean).join(" ");

export const AlertDialog = AlertDialogPrimitive.Root;

export function AlertDialogContent({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-scrim" />
      <AlertDialogPrimitive.Content
        className={cx(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-panel border border-line-soft bg-surface-base p-6 shadow-lifted duration-200 sm:max-w-[420px]",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("flex flex-col gap-2 text-left", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cx("font-serif text-title-2 font-normal text-ink-strong", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={cx("font-sans text-body-lg text-ink-muted", className)} {...props} />;
}

export function AlertDialogCancel({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cx("editorial-button editorial-button--secondary", className)} {...props} />;
}

// Por defecto es una acción irreversible: peligro sólido.
export function AlertDialogAction({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action className={cx("editorial-button editorial-button--danger-solid", className)} {...props} />;
}
