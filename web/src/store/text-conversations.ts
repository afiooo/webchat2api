"use client";

import localforage from "localforage";

import type { ChatMessage } from "@/lib/api";

export type TextChatMessageRole = "user" | "assistant" | "error";

export type TextChatMessage = {
  id: string;
  role: TextChatMessageRole;
  content: string;
  model?: string;
  createdAt: string;
};

const textConversationStorage = localforage.createInstance({
  name: "webchat2api",
  storeName: "text_conversations",
});

const TEXT_MESSAGES_KEY = "messages";

function normalizeMessage(message: TextChatMessage & Record<string, unknown>): TextChatMessage | null {
  const role = message.role === "assistant" || message.role === "error" || message.role === "user" ? message.role : null;
  const content = typeof message.content === "string" ? message.content : "";
  if (!role || !content.trim()) {
    return null;
  }
  return {
    id: typeof message.id === "string" && message.id ? message.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    model: typeof message.model === "string" && message.model ? message.model : undefined,
    createdAt: typeof message.createdAt === "string" && message.createdAt ? message.createdAt : new Date().toISOString(),
  };
}

function normalizeMessages(messages: Array<TextChatMessage & Record<string, unknown>>): TextChatMessage[] {
  return messages.flatMap((message) => {
    const normalized = normalizeMessage(message);
    return normalized ? [normalized] : [];
  });
}

export function textMessagesToChatMessages(messages: TextChatMessage[]): ChatMessage[] {
  return messages.flatMap((message) => {
    if (message.role === "error") {
      return [];
    }
    return [{ role: message.role, content: message.content }];
  });
}

export async function listTextMessages(): Promise<TextChatMessage[]> {
  const items = (await textConversationStorage.getItem<Array<TextChatMessage & Record<string, unknown>>>(TEXT_MESSAGES_KEY)) || [];
  return normalizeMessages(items);
}

export async function saveTextMessages(messages: TextChatMessage[]): Promise<void> {
  await textConversationStorage.setItem(TEXT_MESSAGES_KEY, normalizeMessages(messages));
}

export async function clearTextMessages(): Promise<void> {
  await textConversationStorage.removeItem(TEXT_MESSAGES_KEY);
}
