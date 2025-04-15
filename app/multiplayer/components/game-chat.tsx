"use client";

import type React from "react";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface Message {
	id: string;
	sender: {
		id: string;
		name: string;
		avatar: string;
		isSystem?: boolean;
	};
	content: string;
	timestamp: Date;
	type: "text" | "system" | "event";
}

interface GameChatProps {
	sessionId: string;
	className?: string;
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}

export function GameChat({
	sessionId,
	className,
	collapsed = false,
	onToggleCollapse,
}: GameChatProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Simulate initial messages
	useEffect(() => {
		const initialMessages: Message[] = [
			{
				id: "1",
				sender: {
					id: "system",
					name: "System",
					avatar: "/avatar.svg?height=40&width=40",
					isSystem: true,
				},
				content:
					"Welcome to the CPR & AED Challenge session! Get ready to test your knowledge.",
				timestamp: new Date(Date.now() - 300000),
				type: "system",
			},
			{
				id: "2",
				sender: {
					id: "host",
					name: "John Doe",
					avatar: "/avatar.svg?height=40&width=40",
				},
				content:
					"Hi everyone! Let's wait for all players to be ready before we start.",
				timestamp: new Date(Date.now() - 240000),
				type: "text",
			},
			{
				id: "3",
				sender: {
					id: "system",
					name: "System",
					avatar: "/avatar.svg?height=40&width=40",
					isSystem: true,
				},
				content: "Sarah Johnson has joined the session.",
				timestamp: new Date(Date.now() - 180000),
				type: "event",
			},
			{
				id: "4",
				sender: {
					id: "user2",
					name: "Sarah Johnson",
					avatar: "/avatar.svg?height=40&width=40",
				},
				content: "I'm ready! This is going to be fun.",
				timestamp: new Date(Date.now() - 120000),
				type: "text",
			},
			{
				id: "5",
				sender: {
					id: "system",
					name: "System",
					avatar: "/avatar.svg?height=40&width=40",
					isSystem: true,
				},
				content: "Michael Smith has joined the session.",
				timestamp: new Date(Date.now() - 60000),
				type: "event",
			},
		];

		setMessages(initialMessages);
	}, []); // No dependencies needed as this should only run once on mount

	// Simulate other users typing and sending messages
	useEffect(() => {
		const simulateTyping = setInterval(() => {
			if (Math.random() > 0.7) {
				const users = ["Sarah Johnson", "Michael Smith", "Emily Davis"];
				const userIndex = Math.floor(Math.random() * users.length);
				const userName = users[userIndex];
				const userId = `user${userIndex + 2}`;

				// Simulate typing
				setMessages((prev) => [
					...prev,
					{
						id: `typing-${Date.now()}`,
						sender: {
							id: userId,
							name: userName,
							avatar: "/avatar.svg?height=40&width=40",
						},
						content: "typing",
						timestamp: new Date(),
						type: "event",
					},
				]);

				// Simulate message after typing
				setTimeout(() => {
					const messages = [
						"Good luck everyone!",
						"I've been studying for this all week.",
						"Does anyone know how many questions there will be?",
						"I'm a bit nervous, but excited!",
						"Let's do our best!",
					];
					const messageIndex = Math.floor(Math.random() * messages.length);

					setMessages((prev) => {
						// Remove typing indicator
						const filtered = prev.filter(
							(msg) => msg.id !== `typing-${Date.now()}`,
						);

						// Add actual message
						return [
							...filtered,
							{
								id: `msg-${Date.now()}`,
								sender: {
									id: userId,
									name: userName,
									avatar: "/avatar.svg?height=40&width=40",
								},
								content: messages[messageIndex],
								timestamp: new Date(),
								type: "text",
							},
						];
					});
				}, 2000);
			}
		}, 15000);

		return () => clearInterval(simulateTyping);
	}, []);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]); // Only re-run when the number of messages changes

	const handleSendMessage = () => {
		if (!inputValue.trim()) return;

		const newMessage: Message = {
			id: `user-${Date.now()}`,
			sender: {
				id: "user1",
				name: "You",
				avatar: "/avatar.svg?height=40&width=40",
			},
			content: inputValue,
			timestamp: new Date(),
			type: "text",
		};

		setMessages((prev) => [...prev, newMessage]);
		setInputValue("");
		setIsTyping(false);

		// Focus back on input
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	if (collapsed) {
		return (
			<Button
				variant="outline"
				className={cn(
					"fixed right-4 bottom-4 z-50 flex items-center gap-2",
					className,
				)}
				onClick={onToggleCollapse}
			>
				<span>Chat</span>
				<Badge variant="secondary" className="ml-1">
					{messages.filter((m) => m.type !== "event").length}
				</Badge>
			</Button>
		);
	}

	return (
		<Card className={cn("flex h-[400px] flex-col gap-0 pt-0 pb-0", className)}>
			<CardHeader className="p-3">
				<CardTitle className="flex items-center justify-between text-base">
					<span>Session Chat</span>
					{onToggleCollapse && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 w-7 p-0"
							onClick={onToggleCollapse}
						>
							<span className="sr-only">Minimize</span>
							<span>−</span>
						</Button>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 overflow-hidden p-0">
				<ScrollArea className="h-full">
					<div className="flex flex-col gap-3 p-3">
						{messages.map((message) => {
							if (message.type === "event") {
								if (message.content === "typing") {
									return (
										<div
											key={message.id}
											className="flex items-center gap-2 text-muted-foreground text-sm"
										>
											<Avatar className="h-6 w-6">
												<AvatarImage
													src={message.sender.avatar}
													alt={message.sender.name}
												/>
												<AvatarFallback>
													{message.sender.name[0]}
												</AvatarFallback>
											</Avatar>
											<div className="flex items-center gap-1">
												<span className="font-medium text-foreground">
													{message.sender.name}
												</span>
												<span className="flex items-center">
													is typing
													<span className="ml-1 inline-flex">
														<span className="animate-bounce">.</span>
														<span
															className="animate-bounce"
															style={{ animationDelay: "0.2s" }}
														>
															.
														</span>
														<span
															className="animate-bounce"
															style={{ animationDelay: "0.4s" }}
														>
															.
														</span>
													</span>
												</span>
											</div>
										</div>
									);
								}

								return (
									<div
										key={message.id}
										className="text-center text-muted-foreground text-xs"
									>
										<span>{message.content}</span>
										<span className="ml-1">
											({formatTime(message.timestamp)})
										</span>
									</div>
								);
							}

							if (message.type === "system") {
								return (
									<div
										key={message.id}
										className="mx-auto max-w-[85%] rounded-lg bg-muted px-3 py-2 text-center text-sm"
									>
										<p>{message.content}</p>
										<p className="mt-1 text-muted-foreground text-xs">
											{formatTime(message.timestamp)}
										</p>
									</div>
								);
							}

							const isCurrentUser = message.sender.name === "You";

							return (
								<div
									key={message.id}
									className={cn(
										"flex gap-2",
										isCurrentUser ? "flex-row-reverse" : "flex-row",
									)}
								>
									<Avatar className="mt-1 h-8 w-8">
										<AvatarImage
											src={message.sender.avatar}
											alt={message.sender.name}
										/>
										<AvatarFallback>{message.sender.name[0]}</AvatarFallback>
									</Avatar>
									<div
										className={cn(
											"max-w-[75%] rounded-lg px-3 py-2",
											isCurrentUser
												? "bg-primary text-primary-foreground"
												: "bg-muted text-foreground",
										)}
									>
										{!isCurrentUser && (
											<p className="mb-1 font-medium text-xs">
												{message.sender.name}
											</p>
										)}
										<p>{message.content}</p>
										<p
											className={cn(
												"mt-1 text-right text-xs",
												isCurrentUser
													? "text-primary-foreground/70"
													: "text-muted-foreground",
											)}
										>
											{formatTime(message.timestamp)}
										</p>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</div>
				</ScrollArea>
			</CardContent>
			<CardFooter className="p-3 pt-0">
				<form
					className="flex w-full items-center gap-2"
					onSubmit={(e) => {
						e.preventDefault();
						handleSendMessage();
					}}
				>
					<Input
						ref={inputRef}
						type="text"
						placeholder="Type a message..."
						value={inputValue}
						onChange={(e) => {
							setInputValue(e.target.value);
							if (e.target.value && !isTyping) {
								setIsTyping(true);
							} else if (!e.target.value) {
								setIsTyping(false);
							}
						}}
						onKeyDown={handleKeyDown}
						className="flex-1"
					/>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button type="submit" size="icon" disabled={!inputValue.trim()}>
									<Send className="h-4 w-4" />
									<span className="sr-only">Send</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>Send message</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</form>
			</CardFooter>
		</Card>
	);
}
