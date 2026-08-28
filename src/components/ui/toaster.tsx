"use client";

import { useToast } from "./use-toast";
import { Toast } from "./toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <Toast.Title>{title}</Toast.Title>}
              {description && (
                <Toast.Description>{description}</Toast.Description>
              )}
            </div>
            {action}
          </Toast>
        );
      })}
    </>
  );
}
