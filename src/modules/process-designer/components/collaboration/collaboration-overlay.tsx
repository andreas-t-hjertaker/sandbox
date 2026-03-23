"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CollaboratorCursor {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  position: { x: number; y: number };
  selectedNodeId?: string;
}

interface CollaborationOverlayProps {
  collaborators: CollaboratorCursor[];
  currentUserId: string;
}

const CURSOR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export function getCollaboratorColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

export function CollaborationOverlay({
  collaborators,
  currentUserId,
}: CollaborationOverlayProps) {
  const others = collaborators.filter((c) => c.userId !== currentUserId);

  if (others.length === 0) return null;

  return (
    <>
      {/* Cursors on canvas */}
      {others.map((collab) => (
        <div
          key={collab.userId}
          className="pointer-events-none absolute z-50 transition-all duration-300"
          style={{
            left: collab.position.x,
            top: collab.position.y,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* Cursor arrow */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={collab.color}
            className="drop-shadow-md"
          >
            <path d="M0 0 L12 8 L4 8 L0 14 Z" />
          </svg>
          {/* Name label */}
          <div
            className="ml-3 mt-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: collab.color }}
          >
            {collab.displayName}
          </div>
        </div>
      ))}

      {/* Presence bar */}
      <div className="absolute right-3 top-3 z-40 flex items-center gap-1">
        {others.map((collab) => (
          <div
            key={collab.userId}
            className="flex items-center gap-1 rounded-full border bg-white px-2 py-1 shadow-sm dark:bg-zinc-900"
            title={collab.displayName}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: collab.color }}
            />
            <span className="text-[10px] font-medium">
              {collab.displayName.split(" ")[0]}
            </span>
          </div>
        ))}
        <Badge variant="secondary" className="text-[10px]">
          {others.length + 1} online
        </Badge>
      </div>
    </>
  );
}
