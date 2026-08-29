"use client";

import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

interface ToastAction {
  type: typeof actionTypes[keyof typeof actionTypes];
  toast?: ToasterToast;
  toastId?: string;
}

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: ToastAction): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast!, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === action.toastId ? { ...toast, ...action.toast! } : toast
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // ! Side effects ! - This could be extract into a effect or a custom reducer
      if (toastId && toastTimeouts.has(toastId)) {
        const timeout = toastTimeouts.get(toastId);
        clearTimeout(timeout);
        toastTimeouts.delete(toastId);
      }

      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId ? { ...toast, open: false } : toast
        ),
      };
    }

    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action;

      if (toastId && toastTimeouts.has(toastId)) {
        const timeout = toastTimeouts.get(toastId);
        clearTimeout(timeout);
        toastTimeouts.delete(toastId);
      }

      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== toastId),
      };
    }

    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

const dispatch = (action: ToastAction) => {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

const subscribe = (listener: (state: State) => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

export interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

const toast = ({ title, description, action, variant }: ToastProps) => {
  const id = crypto.randomUUID();

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      id,
      title,
      description,
      action,
      variant,
    },
  });

  addToRemoveQueue(id);

  return id;
};

type Toast = Omit<ToasterToast, "id"> & {
  id?: string;
  dismiss: () => void;
  update: (props: Omit<ToasterToast, "id">) => void;
};

const useToast = () => {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    const unsubscribe = subscribe(setState);
    return () => unsubscribe();
  }, []);

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({
      type: actionTypes.DISMISS_TOAST,
      toastId: toastId || state.toasts[0]?.id,
    });
  }, [state.toasts]);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
};

export { useToast, toast };
export type { ToasterToast };
