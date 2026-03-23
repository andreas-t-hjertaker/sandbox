"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { getDefaultContext } from "../lib/context";
import { useChatSession } from "../hooks/use-chat";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import type { CloudAction } from "../lib/cloud-actions";
import type { ChatConfig, ScannedElement } from "../types";

type CloudChatPanelProps = {
  config?: ChatConfig;
  elements?: ScannedElement[];
  onActions?: (actions: CloudAction[]) => void;
  onClose: () => void;
};

export function CloudChatPanel({ config, elements, onActions, onClose }: CloudChatPanelProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const context = useMemo(() => {
    if (config?.contextProvider) {
      return config.contextProvider();
    }
    return getDefaultContext(user, pathname);
  }, [user, pathname, config]);

  const elementsSummary = useMemo(
    () => elements?.map(({ id, label, type, hint }) => ({ id, label, type, hint })),
    [elements]
  );

  const { messages, sendMessage, clearMessages, isStreaming } =
    useChatSession(context, config, { elements: elementsSummary, onActions });

  const title = config?.title || "AI-assistent";
  const welcomeMessage =
    config?.welcomeMessage || "Hei! Hvordan kan jeg hjelpe deg i dag?";
  const placeholder = config?.placeholder || "Skriv en melding...";

  return (
    <motion.div
      layoutId="cloud-morph"
      initial={{ borderRadius: 28 }}
      animate={{
        width: 380,
        height: 500,
        borderRadius: 16,
      }}
      exit={{
        width: 56,
        height: 56,
        borderRadius: 28,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col overflow-hidden border border-border bg-card shadow-xl"
      style={{ originX: 1, originY: 1 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1, duration: 0.15 }}
        className="flex items-center justify-between border-b border-border px-4 py-3"
      >
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={clearMessages}
            disabled={messages.length === 0}
            title="Tøm samtale"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            title="Lukk"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* Meldinger */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.15, duration: 0.15 }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <ChatMessages messages={messages} welcomeMessage={welcomeMessage} />
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.15, duration: 0.15 }}
      >
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={placeholder}
        />
      </motion.div>
    </motion.div>
  );
}
