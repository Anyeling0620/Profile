import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({ className, ...props }) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-sm",
        className,
      )}
      {...props}
    />
  );
}

function Toast({ className, variant = "default", ...props }) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-md border p-6 shadow-lg transition-all",
        "data-[state=open]:translate-x-0 data-[state=open]:opacity-100 data-[state=closed]:translate-x-full data-[state=closed]:opacity-0",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
        variant === "default" &&
          "border-border bg-card text-foreground",
        variant === "success" &&
          "border-none bg-green-500/80 text-white",
        variant === "destructive" &&
          "border-none bg-red-500/80 text-white",
        className,
      )}
      {...props}
    />
  );
}

function ToastAction({ className, ...props }) {
  return (
    <ToastPrimitive.Action
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }) {
  return (
    <ToastPrimitive.Close
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/60 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-hidden group-hover:opacity-100",
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({ className, ...props }) {
  return (
    <ToastPrimitive.Title
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }) {
  return (
    <ToastPrimitive.Description
      className={cn("text-sm text-white", className)}
      {...props}
    />
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
