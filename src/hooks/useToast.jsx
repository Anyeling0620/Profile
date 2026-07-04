import { useEffect, useState } from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000;

let count = 0;
let memoryState = { toasts: [] };
const listeners = [];
const toastTimeouts = new Map();

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function dispatch(action) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = {
        ...memoryState,
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      };
      break;
    case "UPDATE_TOAST":
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((toast) =>
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
        ),
      };
      break;
    case "DISMISS_TOAST": {
      const { toastId } = action;
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((toast) =>
          toast.id === toastId || toastId === undefined
            ? { ...toast, open: false }
            : toast,
        ),
      };
      memoryState.toasts.forEach((toast) => {
        if (toastId !== undefined && toast.id !== toastId) {
          return;
        }

        if (toastTimeouts.has(toast.id)) {
          return;
        }

        const timeout = setTimeout(() => {
          toastTimeouts.delete(toast.id);
          dispatch({ type: "REMOVE_TOAST", toastId: toast.id });
        }, TOAST_REMOVE_DELAY);

        toastTimeouts.set(toast.id, timeout);
      });
      break;
    }
    case "REMOVE_TOAST":
      memoryState = {
        ...memoryState,
        toasts:
          action.toastId === undefined
            ? []
            : memoryState.toasts.filter((toast) => toast.id !== action.toastId),
      };
      break;
    default:
      break;
  }

  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ ...props }) {
  const id = genId();

  const update = (props) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss();
        }
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { toast, useToast };
