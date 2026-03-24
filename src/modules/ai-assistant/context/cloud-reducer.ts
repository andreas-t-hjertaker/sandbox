/**
 * Tilstandsmaskin for Cloud Assistant.
 *
 * States: idle, speaking, navigating, highlighting, touring, dragging, chatOpen
 */

export type CloudMode =
  | "idle"
  | "speaking"
  | "navigating"
  | "highlighting"
  | "touring"
  | "dragging"
  | "chatOpen";

export type BubbleState = {
  message: string;
  variant: "info" | "action" | "data" | "success" | "warning";
  autoHide?: number;
};

export type TourStep = {
  targetId: string;
  message: string;
};

export type CloudState = {
  mode: CloudMode;
  position: { x: number; y: number };
  homePosition: { x: number; y: number };
  activeTarget?: string;
  bubble?: BubbleState;
  tour?: { steps: TourStep[]; current: number };
  chatOpen: boolean;
  isStreaming: boolean;
};

export type CloudAction =
  | { type: "NAVIGATE_TO"; targetId: string; message: string; highlight: boolean }
  | { type: "SPEAK"; message: string; variant?: "info" | "success" | "warning"; autoHide?: number }
  | { type: "DISMISS" }
  | { type: "ARRIVED_AT_TARGET" }
  | { type: "START_TOUR"; steps: TourStep[] }
  | { type: "NEXT_TOUR_STEP" }
  | { type: "CANCEL_TOUR" }
  | { type: "DRAG_START" }
  | { type: "DRAG_END" }
  | { type: "TOGGLE_CHAT" }
  | { type: "OPEN_CHAT" }
  | { type: "CLOSE_CHAT" }
  | { type: "SET_POSITION"; position: { x: number; y: number } }
  | { type: "SHOW_DATA"; message: string; variant?: "info" }
  | { type: "SET_STREAMING"; isStreaming: boolean };

export const initialCloudState: CloudState = {
  mode: "idle",
  position: { x: 0, y: 0 },
  homePosition: { x: 0, y: 0 },
  chatOpen: false,
  isStreaming: false,
};

export function cloudReducer(state: CloudState, action: CloudAction): CloudState {
  switch (action.type) {
    case "NAVIGATE_TO":
      return {
        ...state,
        mode: "navigating",
        activeTarget: action.targetId,
        bubble: {
          message: action.message,
          variant: "info",
        },
        chatOpen: false,
      };

    case "ARRIVED_AT_TARGET":
      return {
        ...state,
        mode: "highlighting",
      };

    case "SPEAK":
      return {
        ...state,
        mode: "speaking",
        bubble: {
          message: action.message,
          variant: action.variant || "info",
          autoHide: action.autoHide,
        },
      };

    case "SHOW_DATA":
      return {
        ...state,
        mode: "speaking",
        bubble: {
          message: action.message,
          variant: action.variant || "info",
        },
      };

    case "DISMISS":
      return {
        ...state,
        mode: "idle",
        activeTarget: undefined,
        bubble: undefined,
      };

    case "START_TOUR":
      if (action.steps.length === 0) return state;
      return {
        ...state,
        mode: "touring",
        tour: { steps: action.steps, current: 0 },
        activeTarget: action.steps[0].targetId,
        bubble: {
          message: action.steps[0].message,
          variant: "info",
        },
        chatOpen: false,
      };

    case "NEXT_TOUR_STEP": {
      if (!state.tour) return { ...state, mode: "idle" };
      const next = state.tour.current + 1;
      if (next >= state.tour.steps.length) {
        return {
          ...state,
          mode: "idle",
          tour: undefined,
          activeTarget: undefined,
          bubble: undefined,
        };
      }
      return {
        ...state,
        mode: "touring",
        tour: { ...state.tour, current: next },
        activeTarget: state.tour.steps[next].targetId,
        bubble: {
          message: state.tour.steps[next].message,
          variant: "info",
        },
      };
    }

    case "CANCEL_TOUR":
      return {
        ...state,
        mode: "idle",
        tour: undefined,
        activeTarget: undefined,
        bubble: undefined,
      };

    case "DRAG_START":
      return {
        ...state,
        mode: "dragging",
        activeTarget: undefined,
        bubble: undefined,
        tour: undefined,
      };

    case "DRAG_END":
      return {
        ...state,
        mode: "idle",
      };

    case "TOGGLE_CHAT":
      return {
        ...state,
        mode: state.chatOpen ? "idle" : "chatOpen",
        chatOpen: !state.chatOpen,
        activeTarget: undefined,
        bubble: undefined,
      };

    case "OPEN_CHAT":
      return {
        ...state,
        mode: "chatOpen",
        chatOpen: true,
        activeTarget: undefined,
        bubble: undefined,
      };

    case "CLOSE_CHAT":
      return {
        ...state,
        mode: "idle",
        chatOpen: false,
      };

    case "SET_POSITION":
      return {
        ...state,
        position: action.position,
      };

    case "SET_STREAMING":
      return {
        ...state,
        isStreaming: action.isStreaming,
      };

    default:
      return state;
  }
}
