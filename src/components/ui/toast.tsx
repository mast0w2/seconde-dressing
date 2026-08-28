import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "relative w-full rounded-md border p-4 shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive: "bg-destructive text-destructive-foreground border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const toastActionVariants = cva(
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastActionElement extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  altText?: string;
}

const ToastAction = React.forwardRef<HTMLButtonElement, ToastActionElement & VariantProps<typeof toastActionVariants>>(
  ({ className, variant, altText, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(toastActionVariants({ variant }), className)}
        aria-label={altText}
        {...props}
      />
    );
  }
);
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-0 ring-offset-background transition-opacity hover:bg-destructive/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none group-hover:opacity-100",
      className
    )}
    aria-label="Close"
    {...props}
  />
));
ToastClose.displayName = "ToastClose";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

const ToastProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastProvider.displayName = "ToastProvider";

const ToastTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn("mb-1 font-semibold text-sm", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    role="alert"
    {...props}
  />
));
Toast.displayName = "Toast";

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
