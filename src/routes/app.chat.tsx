import { createFileRoute, Navigate } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Smile, Paperclip, MoreVertical, Check, CheckCheck, Users } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
});

function formatDateBadge(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ChatPage() {
  const { currentUser, state, sendMessage, markMessagesAsRead } = useStore();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.messages.length]);

  useEffect(() => {
    if (currentUser) {
      markMessagesAsRead(currentUser.id);
    }
  }, [state.messages.length, currentUser, markMessagesAsRead]);

  if (!currentUser) return <Navigate to="/login" />;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    sendMessage(currentUser.id, v);
    setText("");
  };

  const userById = (id: string) => state.users.find((u) => u.id === id);
  const lastMessage = state.messages[state.messages.length - 1];
  const unreadCount = state.messages.filter(
    (m) => !m.readBy?.includes(currentUser.id) && m.userId !== currentUser.id,
  ).length;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-1rem)] md:mt-2 md:mr-2 rounded-lg border border-border overflow-hidden bg-background">
      {/* Right Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10 relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar className="h-10 w-10 border border-border shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                <Users className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight">Team Chat</h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {state.users.length} members
                <span className="w-1 h-1 rounded-full bg-border"></span>
                Click for group info
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="hidden md:flex h-8 text-xs">
              Add Member
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-4 bg-muted/20"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          {state.messages.map((m, i) => {
            const u = userById(m.userId);
            const isMe = m.userId === currentUser.id;
            const prev = state.messages[i - 1];
            const isNewDay =
              !prev ||
              new Date(m.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
            const showAvatar = isNewDay || prev.userId !== m.userId;
            const initials = u?.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            // For mock demo: read if everyone else has read it (length > 1)
            const isRead = m.readBy && m.readBy.length > 1;

            return (
              <div key={m.id} className="flex flex-col gap-2 relative">
                {isNewDay && (
                  <div className="flex justify-center mt-3 mb-1">
                    <span className="bg-card/80 backdrop-blur-sm border border-border/50 text-foreground/70 text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm">
                      {formatDateBadge(m.createdAt)}
                    </span>
                  </div>
                )}

                <div className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 shrink-0 flex items-end pb-1">
                    {showAvatar && !isMe && (
                      <Avatar className="h-7 w-7 shadow-sm border border-border/50">
                        {u?.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {showAvatar && !isMe && (
                      <span className="text-[11px] font-semibold text-muted-foreground mb-0.5 ml-1">
                        {u?.name}
                      </span>
                    )}

                    <div
                      className={`relative px-3.5 pt-2 pb-1.5 shadow-sm text-[13.5px] leading-relaxed transition-shadow ${
                        isMe
                          ? "bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-blue-600/10"
                          : "bg-card text-card-foreground border border-border/50 rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      <div className="break-words mr-4">{m.text}</div>

                      <div
                        className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isMe ? "text-blue-100" : "text-muted-foreground"} text-[9px]`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe &&
                          (isRead ? (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="bg-card/90 backdrop-blur-md border-t border-border px-4 py-3 sticky bottom-0 z-10 shadow-sm">
          <form onSubmit={send} className="flex items-end gap-2 max-w-4xl mx-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                >
                  <Smile className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-auto p-0 border-none shadow-none bg-transparent mb-2"
              >
                <EmojiPicker
                  onEmojiClick={(e) => setText((prev) => prev + e.emoji)}
                  theme={Theme.AUTO}
                  previewConfig={{ showPreview: false }}
                />
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-full hidden sm:flex transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-2xl bg-muted border-transparent focus-visible:ring-1 focus-visible:ring-primary h-11 px-4 text-[14px]"
            />

            {text.trim() ? (
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0 text-muted-foreground rounded-full pointer-events-none"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
