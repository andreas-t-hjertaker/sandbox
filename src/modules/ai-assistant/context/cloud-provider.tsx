"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import {
  cloudReducer,
  initialCloudState,
  type CloudState,
  type CloudAction,
  type TourStep,
} from "./cloud-reducer";

type CloudContextValue = {
  state: CloudState;
  dispatch: (action: CloudAction) => void;
  navigateTo: (targetId: string, message: string, highlight?: boolean) => void;
  speak: (message: string, variant?: "info" | "success" | "warning", autoHide?: number) => void;
  dismiss: () => void;
  startTour: (steps: TourStep[]) => void;
  nextTourStep: () => void;
  cancelTour: () => void;
  toggleChat: () => void;
};

const CloudContext = createContext<CloudContextValue | null>(null);

export function CloudProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cloudReducer, initialCloudState);

  const navigateTo = useCallback(
    (targetId: string, message: string, highlight = true) => {
      dispatch({ type: "NAVIGATE_TO", targetId, message, highlight });
    },
    []
  );

  const speak = useCallback(
    (message: string, variant?: "info" | "success" | "warning", autoHide?: number) => {
      dispatch({ type: "SPEAK", message, variant, autoHide });
    },
    []
  );

  const dismiss = useCallback(() => {
    dispatch({ type: "DISMISS" });
  }, []);

  const startTour = useCallback((steps: TourStep[]) => {
    dispatch({ type: "START_TOUR", steps });
  }, []);

  const nextTourStep = useCallback(() => {
    dispatch({ type: "NEXT_TOUR_STEP" });
  }, []);

  const cancelTour = useCallback(() => {
    dispatch({ type: "CANCEL_TOUR" });
  }, []);

  const toggleChat = useCallback(() => {
    dispatch({ type: "TOGGLE_CHAT" });
  }, []);

  return (
    <CloudContext.Provider
      value={{
        state,
        dispatch,
        navigateTo,
        speak,
        dismiss,
        startTour,
        nextTourStep,
        cancelTour,
        toggleChat,
      }}
    >
      {children}
    </CloudContext.Provider>
  );
}

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) {
    throw new Error("useCloud må brukes innenfor en CloudProvider");
  }
  return context;
}
