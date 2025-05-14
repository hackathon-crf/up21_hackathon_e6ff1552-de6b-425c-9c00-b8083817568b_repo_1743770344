"use client";

import Fuse from "fuse.js";
import {
	Archive,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	Clock,
	Filter,
	MessageSquare,
	MoreHorizontal,
	Pencil,
	Pin,
	Plus,
	RotateCcw,
	Search,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { DatePicker } from "~/components/ui/date-picker";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useIsMobile } from "~/hooks/use-mobile";
import { toast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

// Create a wrapper for DatePicker to handle null to undefined conversion
const DatePickerAdapter = ({
	date,
	setDate,
	...props
}: {
	date: Date | null;
	setDate: (date: Date | null) => void;
} & Omit<React.ComponentProps<typeof DatePicker>, "date" | "setDate">) => {
	// Create a wrapper function that converts undefined to null
	const handleDateChange = (newDate: Date | undefined) => {
		setDate(newDate || null);
	};

	return (
		<DatePicker
			date={date === null ? undefined : date}
			setDate={handleDateChange}
			{...props}
		/>
	);
};

// Define Session type based on properties used in the component
type Session = {
	id: string;
	title?: string;
	is_pinned: boolean;
	status: string;
	created_at: Date | string;
	updated_at?: Date | string | null;
	position?: number;
	model?: string;
	user_id?: string;
};

// Update FilterOptions type to include specific dates
type FilterOptions = {
	pinned: boolean;
	archived: boolean;
	unread: boolean;
	date: "today" | "week" | "month" | "all" | "custom";
	startDate: Date | null;
	endDate: Date | null;
};

export function ChatSidebar() {
	const pathname = usePathname();
	const router = useRouter();
	const isMobile = useIsMobile();
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("all");
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);
	const [editTitle, setEditTitle] = useState("");
	const [showRenameDialog, setShowRenameDialog] = useState(false);
	const [showFilterPopover, setShowFilterPopover] = useState(false);
	const [showSortPopover, setShowSortPopover] = useState(false);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [sortField, setSortField] = useState<
		"updated_at" | "created_at" | "position"
	>("updated_at");

	// Filter options
	const [filterOptions, setFilterOptions] = useState<FilterOptions>({
		pinned: false,
		archived: false,
		unread: false,
		date: "all",
		startDate: null,
		endDate: null,
	});

	const currentSessionId =
		pathname.includes("/chat/") && pathname !== "/chat/settings"
			? pathname.split("/").pop()
			: undefined;

	// Handle component lifecycle and error handling
	useEffect(() => {
		// Global error handler for unexpected errors
		const errorHandler = (event: ErrorEvent) => {
			console.error("Error:", event.message);
			toast({
				title: "Unexpected Error",
				description: event.message,
				variant: "destructive",
			});
		};

		// Track open menu and mouse position
		let activeMenuEl: Element | null = null;
		let lastMousePosition = { x: 0, y: 0 };

		// Close menus when clicking outside
		const handleOutsideClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			// If click is not on a menu or a menu trigger, close all menus
			if (
				!target.closest('[id^="menu-"]') &&
				!target.closest("[data-menu-trigger]")
			) {
				const allMenus = document.querySelectorAll('[id^="menu-"]');
				for (const menu of allMenus) {
					menu.classList.add("hidden");
				}
				activeMenuEl = null;
			}
		};

		// Track mouse movement to close menus when moving away
		const handleMouseMove = (event: MouseEvent) => {
			const { clientX, clientY } = event;

			// Find any open menu
			if (!activeMenuEl) {
				const openMenus = Array.from(
					document.querySelectorAll('[id^="menu-"]'),
				).filter((menu) => !menu.classList.contains("hidden"));

				if (openMenus.length > 0) {
					activeMenuEl = openMenus[0] || null;
					lastMousePosition = { x: clientX, y: clientY };
				}
			} else {
				// Calculate distance from last position
				const distance = Math.sqrt(
					(clientX - lastMousePosition.x) ** 2 +
						(clientY - lastMousePosition.y) ** 2,
				);

				// Get menu bounds
				const menuRect = activeMenuEl.getBoundingClientRect();
				const isOverMenu =
					clientX >= menuRect.left &&
					clientX <= menuRect.right &&
					clientY >= menuRect.top &&
					clientY <= menuRect.bottom;

				// Check if mouse is far from menu and not over it
				if (!isOverMenu) {
					const distanceFromMenu = Math.min(
						Math.abs(clientX - menuRect.left),
						Math.abs(clientX - menuRect.right),
						Math.abs(clientY - menuRect.top),
						Math.abs(clientY - menuRect.bottom),
					);

					// Close menu if mouse is far enough from it (40px threshold)
					if (distanceFromMenu > 40) {
						activeMenuEl.classList.add("hidden");
						activeMenuEl = null;
					}
				}

				lastMousePosition = { x: clientX, y: clientY };
			}
		};

		window.addEventListener("error", errorHandler);
		document.addEventListener("click", handleOutsideClick);
		document.addEventListener("mousemove", handleMouseMove);

		return () => {
			window.removeEventListener("error", errorHandler);
			document.removeEventListener("click", handleOutsideClick);
			document.removeEventListener("mousemove", handleMouseMove);
		};
	}, []);

	// Get chat sessions with filtering options
	const sessionsData = api.chat.getSessions.useQuery({
		status: activeTab === "archived" ? "archived" : "active",
		includeDeleted: false,
		sortBy: activeTab === "pinned" ? "position" : sortField,
		sortOrder: sortOrder,
	});

	const { data: allSessions, isLoading, refetch } = sessionsData;

	// Get message counts for sessions
	const [messageCounts, setMessageCounts] = useState<Record<string, number>>(
		{},
	);

	// Fetch message counts whenever sessions change
	const sessionIds = React.useMemo(
		() => (allSessions ? allSessions.map((session) => session.id) : []),
		[allSessions],
	);

	// For debugging
	useEffect(() => {
		console.log("[DEBUG] Session IDs:", sessionIds);
	}, [sessionIds]);

	// First fetch the message counts
	const { data: messageCountsData, isLoading: isLoadingCounts } =
		api.chat.getSessionMessageCounts.useQuery(
			{ sessionIds },
			{
				enabled: sessionIds.length > 0,
			},
		);

	// Then update the state when the data changes
	useEffect(() => {
		if (messageCountsData) {
			console.log("[DEBUG] Message counts received:", messageCountsData);
			// Convert array of counts to a record object for easy lookup
			const countsMap: Record<string, number> = {};
			for (const item of messageCountsData) {
				countsMap[item.session_id] = item.count;
			}
			console.log("[DEBUG] Message counts map:", countsMap);
			setMessageCounts(countsMap);
		}
	}, [messageCountsData]);

	// Create Fuse instance for fuzzy search when allSessions changes
	const fuseInstance = React.useMemo(() => {
		if (!allSessions) return null;
		return new Fuse(allSessions, {
			keys: ["title", "last_message"],
			includeScore: true,
			threshold: 0.4,
			ignoreLocation: true,
		});
	}, [allSessions]);

	// Apply fuzzy search if search query exists and is short (for better responsiveness)
	const sessions = React.useMemo(() => {
		if (!allSessions) return [];

		// Apply fuzzy search for short queries (1-3 characters)
		if (searchQuery.trim() !== "" && searchQuery.length <= 3 && fuseInstance) {
			const searchResults = fuseInstance.search(searchQuery);
			return searchResults.map((result) => result.item);
		}

		// Filter by pinned status when "pinned" tab is selected
		if (activeTab === "pinned") {
			return allSessions.filter((session) => session.is_pinned);
		}

		// Otherwise, use the server-filtered results directly
		return allSessions;
	}, [allSessions, searchQuery, fuseInstance, activeTab]);

	// Create new chat session
	const [creating, setCreating] = useState(false);
	const createSessionMutation = api.chat.createSession.useMutation({
		onMutate: () => {
			setCreating(true);
			// Show a loading toast
			toast({
				title: "Creating new chat session",
				description: "Please wait...",
			});
		},
		onSuccess: (data) => {
			console.log("[DEBUG] Session created successfully:", data?.id);

			// Make sure we have a valid session ID
			if (!data || !data.id) {
				console.error("[DEBUG] Created session has no ID");
				setCreating(false);
				toast({
					title: "Error",
					description: "Session created but no ID returned",
					variant: "destructive",
				});
				return;
			}

			// Delay navigation slightly to allow database transaction to complete
			setTimeout(() => {
				refetch().then(() => {
					setCreating(false);

					// Navigate to the new session with a slight delay to ensure data consistency
					console.log(`[DEBUG] Navigating to new chat session: ${data.id}`);
					router.push(`/chat/${data.id}`);

					toast({
						title: "Chat created",
						description: "New chat session started successfully",
					});
				});
			}, 300);
		},
		onError: (error) => {
			console.error("[DEBUG] Error creating chat session:", error);
			setCreating(false);
			toast({
				title: "Failed to create chat",
				description:
					error.message || "There was an error creating your chat session",
				variant: "destructive",
			});
		},
	});

	// Update session
	const updateSessionMutation = api.chat.updateSession.useMutation({
		onSuccess: () => {
			refetch();
		},
		onError: (error) => {
			console.error("Failed to update session:", error);
			toast({
				title: "Failed to update chat",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	// Delete session
	const deleteSessionMutation = api.chat.deleteSession.useMutation({
		onSuccess: (data) => {
			refetch();
			setShowDialog(false);

			// If we deleted the currently open session, redirect to /chat
			if (data.id === currentSessionId) {
				router.push("/chat");
			}

			toast({
				title: "Chat deleted",
				description: "The chat has been successfully deleted",
			});
		},
		onError: (error) => {
			console.error("Failed to delete session:", error);
			setShowDialog(false);

			toast({
				title: "Error",
				description: `Failed to delete chat: ${error.message}`,
				variant: "destructive",
			});
		},
	});

	// Delete all sessions
	const deleteAllSessionsMutation = api.chat.deleteAllSessions.useMutation({
		onSuccess: (data) => {
			refetch();
			setShowDeleteAllDialog(false);
			
			// Always redirect to /chat after deleting all sessions
			router.push("/chat");

			toast({
				title: "All chats deleted",
				description: `Successfully deleted ${data.count} chat sessions`,
			});
		},
		onError: (error) => {
			console.error("Failed to delete all sessions:", error);
			setShowDeleteAllDialog(false);

			toast({
				title: "Error",
				description: `Failed to delete all chats: ${error.message}`,
				variant: "destructive",
			});
		},
	});

	// Handle filter changes
	const handleFilterChange = (
		key: keyof FilterOptions,
		value: boolean | string | Date | null,
	) => {
		setFilterOptions((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Reset filters
	const resetFilters = () => {
		setFilterOptions({
			pinned: false,
			archived: false,
			unread: false,
			date: "all",
			startDate: null,
			endDate: null,
		});
		setShowFilterPopover(false);
	};

	// Action handlers
	const handleCreateChat = () => {
		createSessionMutation.mutate({
			title: "New Chat",
			is_pinned: false,
		});
	};

	const handleDeleteAllChats = () => {
		setShowDeleteAllDialog(true);
	};

	const confirmDeleteAllChats = () => {
		deleteAllSessionsMutation.mutate();
	};

	const handleTogglePin = (e: React.MouseEvent, session: Session) => {
		e.preventDefault();
		e.stopPropagation();

		updateSessionMutation.mutate({
			session_id: session.id,
			is_pinned: !session.is_pinned,
		});
	};

	const handleToggleArchive = (e: React.MouseEvent, session: Session) => {
		e.preventDefault();
		e.stopPropagation();

		updateSessionMutation.mutate({
			session_id: session.id,
			status: session.status === "archived" ? "active" : "archived",
		});
	};

	const handleDeleteConfirm = (permanent = true) => {
		if (selectedSessionId) {
			deleteSessionMutation.mutate({
				session_id: selectedSessionId,
				permanent,
			});
		}
	};

	const openDeleteDialog = (e: React.MouseEvent, sessionId: string) => {
		e.preventDefault();
		e.stopPropagation();
		setSelectedSessionId(sessionId);
		setShowDialog(true);
	};

	const openRenameDialog = (e: React.MouseEvent, session: Session) => {
		e.preventDefault();
		e.stopPropagation();
		setSelectedSessionId(session.id);
		setEditTitle(session.title || "New Chat");
		setShowRenameDialog(true);
	};

	const handleRename = () => {
		if (selectedSessionId && editTitle.trim()) {
			updateSessionMutation.mutate({
				session_id: selectedSessionId,
				title: editTitle.trim(),
			});
			setShowRenameDialog(false);
		}
	};

	// Function to close all menus except the one being opened
	const toggleMenu = (e: React.MouseEvent, sessionId: string) => {
		e.preventDefault();
		e.stopPropagation();

		// First close all menus
		const allMenus = document.querySelectorAll('[id^="menu-"]');
		for (const menu of allMenus) {
			if (menu.id !== `menu-${sessionId}`) {
				menu.classList.add("hidden");
			}
		}

		// Then toggle the target menu
		const targetMenu = document.getElementById(`menu-${sessionId}`);
		if (targetMenu) {
			targetMenu.classList.toggle("hidden");
		}
	};

	// Calculate relative time for timestamps
	const getRelativeTime = (date: Date | string) => {
		const now = new Date();
		const then = new Date(date);
		const diffInMinutes = Math.floor(
			(now.getTime() - then.getTime()) / (1000 * 60),
		);

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays === 1) return "Yesterday";
		if (diffInDays < 7) return `${diffInDays}d ago`;

		return then.toLocaleDateString();
	};

	// Count active filters to show indicator
	const activeFilterCount = Object.entries(filterOptions).filter(
		([key, value]) => {
			if (key === "startDate" || key === "endDate") {
				return value !== null; // Only count dates if they're defined
			}
			return typeof value === "boolean" ? value : value !== "all";
		},
	).length;

	return (
		<div
			className={cn(
				"flex h-full w-full flex-col gap-2",
				"bg-background p-4",
				isMobile ? "min-w-0 max-w-[100vw]" : "w-[360px] min-w-[360px]",
			)}
		>
			<div className="-mx-4 flex flex-col gap-2 px-4">
				{/* Search and New Chat full-width block */}
				<div className="relative w-full">
					<div className="-mx-4 flex w-[calc(100%+2rem)] flex-col gap-2 px-4">
						<div className="relative">
							<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search conversations..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-8"
							/>
						</div>

						<div className="flex w-full gap-2">
							<Button
								onClick={handleCreateChat}
								className="flex-1 justify-center gap-2"
							>
								<Plus className="h-4 w-4" />
								New Chat
							</Button>
							<Button
								onClick={handleDeleteAllChats}
								variant="destructive"
								className="flex gap-1"
								title="Delete all chats"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Existing tabs navigation and content (full-width tabs) */}
			<div className="border-border border-b px-4">
				<Tabs
					defaultValue="all"
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full"
				>
					<TabsList className="-mx-4 grid h-10 w-[calc(100%+2rem)] grid-cols-3 p-0">
						<TabsTrigger
							value="all"
							className="flex w-full items-center justify-center rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent"
						>
							All
						</TabsTrigger>
						<TabsTrigger
							value="pinned"
							className="flex w-full items-center justify-center rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent"
						>
							{!isMobile && <Pin className="mr-1 h-3.5 w-3.5" />}Pinned
						</TabsTrigger>
						<TabsTrigger
							value="archived"
							className="flex w-full items-center justify-center rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent"
						>
							{!isMobile && <Archive className="mr-1 h-3.5 w-3.5" />}Archived
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Conversations List */}
			<div className="chat-scrollbar max-h-screen flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="space-y-3 p-3">
						{["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((id) => (
							<Skeleton key={id} className="h-20 w-full rounded-md" />
						))}
					</div>
				) : !sessions || sessions.length === 0 ? (
					<div className="p-6 text-center text-muted-foreground">
						<p>No chats found</p>
						<p className="mt-1 text-xs">
							{activeTab === "pinned"
								? "Pin conversations to see them here"
								: activeTab === "archived"
									? "Archive conversations to store them for later reference"
									: "Start a new conversation"}
						</p>
					</div>
				) : (
					<div className="space-y-4 p-2">
						{/* Group conversations by date */}
						{sessions?.map((session) => (
							<Link
								key={session.id}
								href={`/chat/${session.id}`}
								className={cn(
									"group block rounded-md p-3 hover:bg-muted/50",
									session.id === currentSessionId &&
										"bg-primary/10 hover:bg-primary/15",
								)}
							>
								<div
									className={cn(
										"relative flex flex-col",
										session.is_pinned && "-ml-2 border-primary border-l-2 pl-2",
									)}
								>
									{/* Top row: title and timestamp */}
									<div className="mb-1 flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<span
												className={cn(
													"truncate font-medium text-sm",
													session.id === currentSessionId
														? "text-primary"
														: "text-foreground",
												)}
											>
												{session.title || "New Chat"}
											</span>
											{/* Unread indicator - just a demo, not functional */}
											{session.id.charCodeAt(0) % 3 === 0 && (
												<div className="h-1.5 w-1.5 rounded-full bg-primary" />
											)}
										</div>
										<div className="flex items-center gap-1 text-muted-foreground text-xs">
											<Clock className="h-3 w-3" />
											<span>
												{session.updated_at
													? getRelativeTime(session.updated_at)
													: "Unknown"}
											</span>
										</div>
									</div>

									{/* Middle row: snippet */}
									<p className="mb-2 line-clamp-2 text-muted-foreground text-xs">
										{session.id.length > 10
											? "This is a snippet of the conversation content. It gives a preview of what was discussed..."
											: "Another example of a conversation snippet with different content..."}
									</p>

									{/* Bottom row: message count and actions */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1 text-muted-foreground text-xs">
											<MessageSquare className="h-3.5 w-3.5" />
											<span title={`Session ID: ${session.id}`}>
												{messageCounts[session.id] !== undefined
													? messageCounts[session.id]
													: "?"}
											</span>
										</div>

										{/* Action buttons */}
										<div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
											{/* Pin button as quick access */}
											<button
												type="button"
												className="text-muted-foreground hover:text-foreground"
												onClick={(e) => handleTogglePin(e, session)}
												title={session.is_pinned ? "Unpin" : "Pin"}
											>
												<Pin
													className={cn(
														"h-3.5 w-3.5",
														session.is_pinned && "fill-primary text-primary",
													)}
												/>
											</button>

											{/* More options menu */}
											<div className="relative">
												<button
													type="button"
													className="text-muted-foreground hover:text-foreground"
													onClick={(e) => {
														e.stopPropagation();
														toggleMenu(e, session.id);
													}}
													title="More options"
													data-menu-trigger
												>
													<MoreHorizontal className="h-3.5 w-3.5" />
												</button>

												{/* Dropdown menu with other actions */}
												<div
													id={`menu-${session.id}`}
													className="absolute top-full right-0 z-10 mt-1 hidden w-32 rounded-md bg-popover p-1 shadow-lg"
													onMouseLeave={() => {
														// Close the menu when mouse leaves this area
														const menu = document.getElementById(
															`menu-${session.id}`,
														);
														if (menu) {
															menu.classList.add("hidden");
														}
													}}
												>
													{/* Pin/Unpin option */}
													<button
														type="button"
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-foreground text-xs hover:bg-accent hover:text-accent-foreground dark:text-zinc-200 dark:hover:bg-zinc-700"
														onClick={(e) => handleTogglePin(e, session)}
													>
														<Pin
															className={cn(
																"h-3.5 w-3.5",
																session.is_pinned &&
																	"fill-primary text-primary",
															)}
														/>
														<span>{session.is_pinned ? "Unpin" : "Pin"}</span>
													</button>

													{/* Rename option */}
													<button
														type="button"
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-foreground text-xs hover:bg-accent hover:text-accent-foreground dark:text-zinc-200 dark:hover:bg-zinc-700"
														onClick={(e) => openRenameDialog(e, session)}
													>
														<Pencil className="h-3.5 w-3.5" />
														<span>Rename</span>
													</button>

													{/* Archive/Unarchive option */}
													<button
														type="button"
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-foreground text-xs hover:bg-accent hover:text-accent-foreground dark:text-zinc-200 dark:hover:bg-zinc-700"
														onClick={(e) => handleToggleArchive(e, session)}
													>
														{session.status === "archived" ? (
															<>
																<RotateCcw className="h-3.5 w-3.5" />
																<span>Unarchive</span>
															</>
														) : (
															<>
																<Archive className="h-3.5 w-3.5" />
																<span>Archive</span>
															</>
														)}
													</button>

													{/* Separator between non-destructive and destructive actions */}
													<div className="my-1 border-border border-t dark:border-zinc-700" />

													{/* Delete option */}
													<button
														type="button"
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-destructive text-xs hover:bg-destructive/10 dark:hover:bg-zinc-700"
														onClick={(e) => openDeleteDialog(e, session.id)}
													>
														<Trash2 className="h-3.5 w-3.5" />
														<span>Delete</span>
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDialog} onOpenChange={setShowDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Chat</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							chat and all its messages from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => handleDeleteConfirm(true)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete All Confirmation Dialog */}
			<AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete All Chats</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete ALL your
							chats and their messages from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteAllChats}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete All
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Rename Dialog */}
			<AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Rename Chat</AlertDialogTitle>
						<AlertDialogDescription>
							Enter a new name for this chat.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="py-4">
						<Input
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							placeholder="Chat name"
							className="w-full"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleRename();
								}
							}}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleRename}>Save</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}