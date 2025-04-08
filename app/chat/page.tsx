"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bot, FileText, Send, User, Loader2, Paperclip, ImageIcon } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { ChatHeader } from "./components/chat-header"
import { FloatingSettingsButton } from "./settings/floating-button"
import { useTheme } from "next-themes"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
  sources?: {
    title: string
    url: string
  }[]
}

export default function ChatPage() {
  const { theme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your Red Cross AI assistant. How can I help with your first aid and emergency response training today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (input.trim()) {
      // Generate unique ID for messages
      const generateId = () => Math.random().toString(36).substring(2, 11)

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: input,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput("")

      // Add loading message
      const loadingMessageId = generateId()
      setMessages((prev) => [
        ...prev,
        {
          id: loadingMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isLoading: true,
        },
      ])

      // Simulate AI typing
      setIsTyping(true)

      // Simulate AI response with RAG sources after a delay
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== loadingMessageId)
            .concat({
              id: generateId(),
              role: "assistant",
              content:
                "When treating a severe bleeding wound, apply direct pressure with a clean cloth or bandage. If blood soaks through, add another layer without removing the first. If possible, elevate the wound above the heart and use pressure points if necessary. Apply a tourniquet only as a last resort when bleeding cannot be controlled by other methods.",
              timestamp: new Date(),
              sources: [
                {
                  title: "Red Cross First Aid Manual",
                  url: "https://redcross.org/firstaid/bleeding",
                },
                {
                  title: "Emergency Response Guidelines",
                  url: "https://redcross.org/emergency/bleeding-control",
                },
              ],
            }),
        )
      }, 2000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-background/80">
      <div className="border-b shadow-sm">
        <ChatHeader title="AI Assistant" description="Ask questions and get personalized first aid guidance" />
      </div>

      <div className="flex-1 flex flex-col p-2 sm:p-6 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-md">
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-6 hide-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%] ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : theme === "dark"
                                ? "bg-zinc-700 text-zinc-200"
                                : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className="space-y-2 w-full">
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : theme === "dark"
                                  ? "bg-zinc-800 text-zinc-100"
                                  : "bg-white border text-zinc-800"
                            }`}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                          </div>

                          <div className="flex justify-between items-center px-1">
                            <div className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</div>
                            {message.sources && message.sources.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 px-2">
                                        <FileText className="h-3 w-3 mr-1" />
                                        <span>{message.sources.length} sources</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-sm">
                                      <div className="space-y-1">
                                        <p className="font-medium text-xs">Sources:</p>
                                        {message.sources.map((source, idx) => (
                                          <div key={idx} className="flex items-center gap-1">
                                            <FileText className="h-3 w-3 flex-shrink-0" />
                                            <a
                                              href={source.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="hover:underline text-primary text-xs truncate"
                                            >
                                              {source.title}
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              </div>

              <Separator className="my-0" />

              <div className="p-3 sm:p-4 bg-card/50 backdrop-blur-sm">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="Ask about first aid procedures, emergency response, or CPR techniques..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-24 py-6 shadow-sm border-2 focus-visible:ring-primary/50"
                  />
                  <div className="absolute right-1 top-1 flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            size="icon"
                            className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send message</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {isTyping ? (
                      <span className="flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        AI is typing...
                      </span>
                    ) : (
                      "Powered by Red Cross AI"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <FloatingSettingsButton />
    </div>
  )
}
