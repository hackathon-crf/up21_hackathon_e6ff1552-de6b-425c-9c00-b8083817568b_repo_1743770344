"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { 
  Bot, FileText, Send, User, Loader2, Paperclip, ImageIcon, XCircle, 
  Link as LinkIcon, ExternalLink, BookOpen, Calendar, Heart
} from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Badge } from "~/components/ui/badge"
import { ChatHeader } from "./components/chat-header"
import { cn } from "~/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
  sources?: {
    title: string
    url: string
    date?: string
    type?: "article" | "manual" | "guideline" | "publication"
  }[]
}

export default function ChatPage() {
  // Using dark mode by default to match the rest of the site
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
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true)
  const [expandedSources, setExpandedSources] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Add a smooth scroll effect when container is resized
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    })
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  const handleSend = () => {
    if (input.trim()) {
      // Hide welcome banner when user sends first message
      if (showWelcomeBanner) {
        setShowWelcomeBanner(false)
      }
      
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
                  date: "2023-09-15",
                  type: "manual"
                },
                {
                  title: "Emergency Response Guidelines",
                  url: "https://redcross.org/emergency/bleeding-control",
                  date: "2024-01-20",
                  type: "guideline"
                },
                {
                  title: "Medical Journal of Emergency Care: Wound Treatment",
                  url: "https://med-journal.org/emergency/wounds",
                  date: "2023-11-05",
                  type: "publication"
                }
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

  // Get source icon based on type
  const getSourceIcon = (type?: string) => {
    switch (type) {
      case "manual":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "guideline":
        return <FileText className="h-3.5 w-3.5" />;
      case "publication":
        return <BookOpen className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  }

  // Format source date
  const formatSourceDate = (dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  // Toggle source expansion for a specific message
  const toggleSourceExpansion = (messageId: string) => {
    setExpandedSources((prev) => (prev === messageId ? null : messageId))
  }

  return (
    <div 
      className={cn(
        "flex flex-col h-screen",
        "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]",
        "from-zinc-900/80 via-zinc-900/90 to-zinc-900",
        "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTEyIDEyaDEydjEySDEyem0yNCAwaDEydjEySDM2em0tMjQgMjRoMTJ2MTJIMTIiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==')]"
      )}
    >
      <div className={cn(
        "border-b backdrop-blur-sm sticky top-0 z-10",
        "bg-zinc-900/90 border-zinc-800/70 shadow-zinc-950/20"
      )}>
        <ChatHeader title="AI Assistant" description="Ask questions and get personalized first aid guidance" />
      </div>

      <div className="flex-1 flex flex-col p-2 sm:p-6 overflow-hidden">
        {showWelcomeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "mb-4 p-5 rounded-2xl relative shadow-md",
              "bg-gradient-to-br from-red-950/30 to-red-900/10 border border-red-900/20"
            )}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/80"
              onClick={() => setShowWelcomeBanner(false)}
            >
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Close welcome banner</span>
            </Button>
            <div className="flex items-start gap-5">
              <div className={cn(
                "flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl shadow-md",
                "bg-gradient-to-br from-red-700 to-red-800 text-red-100 shadow-red-700/10"
              )}>
                <Heart className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-1.5">Welcome to Red Cross AI Assistant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  I can help you with first aid procedures, emergency response protocols, and CPR techniques.
                  Ask me anything about safety training and medical emergencies!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <Card 
          className={cn(
            "flex-1 flex flex-col overflow-hidden shadow-xl rounded-2xl",
            "bg-zinc-900/60 backdrop-blur-sm border-zinc-800/50"
          )}
        >
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full flex flex-col">
              <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-7 hide-scrollbar"
              >
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} relative`}
                    >
                      <div
                        className={`flex items-start gap-3.5 max-w-[90%] sm:max-w-[72%] ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <motion.div
                          initial={{ scale: 0.8, rotate: -5 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className={cn(
                            "flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl shadow-md",
                            message.role === "user"
                              ? "bg-primary/90 text-primary-foreground shadow-primary/10"
                              : "bg-gradient-to-br from-red-800/40 to-red-700/30 text-red-200 border border-red-800/30 shadow-red-900/5"
                          )}
                        >
                          {message.role === "user" ? (
                            <User className="h-5 w-5" /> 
                          ) : (
                            <motion.div
                              animate={{ rotate: [0, 10, 0] }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              <Bot className="h-5 w-5" />
                            </motion.div>
                          )}
                        </motion.div>
                        
                        <div className="space-y-3.5 w-full">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "rounded-2xl px-5 py-4 shadow-sm",
                              message.role === "user"
                                ? "bg-gradient-to-r from-primary/90 to-primary/80 text-primary-foreground shadow-primary/10"
                                : "bg-zinc-800/90 text-zinc-100 border border-zinc-700/40 shadow-zinc-950/5"
                            )}
                          >
                            {message.isLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <p className="leading-relaxed text-sm">
                                {message.content}
                              </p>
                            )}
                          </motion.div>

                          {/* Sources button row */}
                          <div className="flex justify-between items-center px-1">
                            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-zinc-800/60">
                              <div className={cn(
                                "h-1.5 w-1.5 rounded-full", 
                                message.role === "user" 
                                  ? "bg-primary/70" 
                                  : "bg-red-500/70"
                              )}/>
                              {formatTime(message.timestamp)}
                            </div>
                            
                            {message.sources && message.sources.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                              >
                                <Button 
                                  variant={expandedSources === message.id ? "secondary" : "outline"} 
                                  size="sm" 
                                  onClick={() => toggleSourceExpansion(message.id)}
                                  className={cn(
                                    "h-7 px-3 text-xs rounded-full font-normal transition-all",
                                    expandedSources === message.id 
                                      ? "bg-red-900/40 text-red-200 hover:bg-red-900/50 border-red-800/30" 
                                      : "border-dashed bg-zinc-800/60 hover:bg-zinc-800/90"
                                  )}
                                >
                                  <BookOpen className="h-3 w-3 mr-1.5" />
                                  <span>{message.sources.length} {message.sources.length === 1 ? "source" : "sources"}</span>
                                </Button>
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Enhanced sources panel - more compact design with overflow fixes */}
                          <AnimatePresence mode="wait">
                            {expandedSources === message.id && message.sources && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden rounded-xl shadow-lg bg-gradient-to-b from-zinc-800/90 to-zinc-900/80 border border-zinc-700/50 shadow-zinc-950/10"
                              >
                                <div className="p-2.5">
                                  <div className="flex items-center mb-2">
                                    <div className="p-1 mr-1.5 rounded-md bg-red-900/30 text-red-300">
                                      <LinkIcon className="h-3 w-3" />
                                    </div>
                                    <h4 className="text-xs font-medium text-foreground">
                                      Reference Sources
                                    </h4>
                                  </div>
                                  
                                  <ScrollArea className="pr-1.5 scrollbar-thumb-zinc-700">
                                    <div className="space-y-1.5 pb-1 max-h-[140px]">
                                      {message.sources.map((source, idx) => (
                                        <motion.div
                                          key={idx}
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: idx * 0.1 }}
                                          className="flex items-start gap-1.5 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/40"
                                        >
                                          <div className={cn(
                                            "p-0.5 h-5 w-5 rounded-md flex-shrink-0 flex items-center justify-center",
                                            source.type === 'manual' 
                                              ? 'bg-amber-900/30 text-amber-300 border-amber-800/40' 
                                              : source.type === 'guideline' 
                                                ? 'bg-blue-900/30 text-blue-300 border-blue-800/40' 
                                                : 'bg-purple-900/30 text-purple-300 border-purple-800/40',
                                            "border"
                                          )}>
                                            {source.type === 'manual' 
                                              ? <BookOpen className="h-3 w-3" />
                                              : source.type === 'guideline'
                                                ? <FileText className="h-3 w-3" />
                                                : <BookOpen className="h-3 w-3" />
                                            }
                                          </div>
                                          
                                          <div className="flex-1 min-w-0 overflow-hidden">
                                            <div className="flex items-center gap-1">
                                              <h5 className="font-medium text-[11px] truncate">{source.title}</h5>
                                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 whitespace-nowrap flex-shrink-0 bg-zinc-900 border-zinc-700/50">
                                                {source.type || "Article"}
                                              </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{source.url}</p>
                                            {source.date && (
                                              <div className="flex items-center text-[9px] text-zinc-400 mt-0.5">
                                                <Calendar className="h-2 w-2 mr-1 flex-shrink-0" />
                                                <span className="truncate">{formatSourceDate(source.date)}</span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          <a
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center self-start p-1 rounded-md transition-all hover:scale-105 bg-zinc-700/70 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 flex-shrink-0 ml-0.5"
                                            title="Open source"
                                          >
                                            <ExternalLink className="h-2.5 w-2.5" />
                                          </a>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </AnimatePresence>
              </div>

              <Separator className="my-0 bg-zinc-700/50" />

              <div className="p-4 sm:p-5 bg-zinc-800/70 backdrop-blur-sm">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="Ask about first aid procedures, emergency response, or CPR techniques..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-24 py-6 shadow-sm transition-all duration-200 text-base rounded-xl focus-visible:ring-offset-0 bg-zinc-900/80 border-zinc-700/60 focus-visible:border-zinc-600 focus-visible:ring-zinc-700/40"
                  />
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/80"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>Attach file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/80"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>Attach image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            size="icon"
                            className={cn(
                              "h-10 w-10 rounded-full shadow-md transition-all duration-300",
                              !input.trim() 
                                ? "bg-primary/30 text-primary-foreground/60 cursor-not-allowed"
                                : "bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-105 active:scale-95" 
                            )}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>Send message</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3.5 px-1">
                  <div className="flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-lg bg-zinc-700/60 text-zinc-300">
                    {isTyping ? (
                      <motion.span 
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        AI is typing...
                      </motion.span>
                    ) : (
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1.5 fill-red-500 stroke-red-500" />
                        <span>
                          Powered by Red Cross AI
                        </span>
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[11px] rounded-md hidden sm:flex items-center gap-2 py-1 px-2 bg-zinc-700/60 text-zinc-300">
                    <div className="flex items-center">
                      <kbd className="px-1.5 py-0.5 font-mono rounded border bg-zinc-800 text-zinc-400 border-zinc-600">Enter</kbd>
                      <span className="mx-1.5 text-muted-foreground">to send</span>
                    </div>
                    <div className="flex items-center">
                      <kbd className="px-1.5 py-0.5 font-mono rounded border bg-zinc-800 text-zinc-400 border-zinc-600">Shift+Enter</kbd>
                      <span className="ml-1.5 text-muted-foreground">for new line</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
