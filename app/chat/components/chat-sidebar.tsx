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
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("all");
	const [showDialog, setShowDialog] = useState(false);
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
		<div className="flex h-full w-72 flex-col border-zinc-800 border-r bg-zinc-900/70">
			{/* Header with search, filter, and sort on the same line */}
			<div className="space-y-2 border-zinc-800 border-b p-3">
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 transform text-muted-foreground" />
						<Input
							placeholder="Search..."
							className="h-9 border-zinc-700 bg-zinc-800/50 pl-8"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"relative h-9 w-9 flex-shrink-0 bg-zinc-800/50",
									activeFilterCount > 0 && "text-primary",
								)}
							>
								<Filter className="h-4 w-4" />
								{activeFilterCount > 0 && (
									<span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
										{activeFilterCount}
									</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-56" align="end">
							<div className="space-y-4">
								<h4 className="font-medium text-sm">Filter Chats</h4>

								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="pinned"
											checked={filterOptions.pinned}
											onCheckedChange={(checked) =>
												handleFilterChange("pinned", checked === true)
											}
										/>
										<Label htmlFor="pinned" className="text-sm">
											Pinned chats
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="archived"
											checked={filterOptions.archived}
											onCheckedChange={(checked) =>
												handleFilterChange("archived", checked === true)
											}
										/>
										<Label htmlFor="archived" className="text-sm">
											Archived chats
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="unread"
											checked={filterOptions.unread}
											onCheckedChange={(checked) =>
												handleFilterChange("unread", checked === true)
											}
										/>
										<Label htmlFor="unread" className="text-sm">
											Unread messages
										</Label>
									</div>
								</div>

								<div className="space-y-2">
									<h5 className="text-muted-foreground text-xs">Date range</h5>
									<div className="grid gap-1">
										{[
											{ label: "All time", value: "all" },
											{ label: "Today", value: "today" },
											{ label: "This week", value: "week" },
											{ label: "This month", value: "month" },
											{ label: "Custom", value: "custom" },
										].map((option) => (
											<Button
												key={option.value}
												variant="ghost"
												size="sm"
												className={cn(
													"justify-start font-normal",
													filterOptions.date === option.value && "bg-zinc-800",
												)}
												onClick={() => handleFilterChange("date", option.value)}
											>
												{option.label}
												{filterOptions.date === option.value && (
													<Check className="ml-auto h-4 w-4" />
												)}
											</Button>
										))}

										{/* Custom date range calendar pickers */}
										{filterOptions.date === "custom" && (
											<div className="space-y-3 pt-2">
												<div className="space-y-1">
													<h6 className="font-medium text-xs">From</h6>
													<DatePickerAdapter
														date={filterOptions.startDate}
														setDate={(date) =>
															handleFilterChange("startDate", date)
														}
														placeholder="Start date"
														className="h-8 text-xs"
													/>
												</div>

												<div className="space-y-1">
													<h6 className="font-medium text-xs">To</h6>
													<DatePickerAdapter
														date={filterOptions.endDate}
														setDate={(date) =>
															handleFilterChange("endDate", date)
														}
														placeholder="End date"
														className="h-8 text-xs"
													/>
												</div>
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center justify-between border-zinc-800 border-t pt-2">
									<Button
										variant="ghost"
										size="sm"
										className="text-xs"
										onClick={resetFilters}
									>
										<X className="mr-1 h-3.5 w-3.5" />
										Clear filters
									</Button>
									<Button
										size="sm"
										className="text-xs"
										onClick={() => setShowFilterPopover(false)}
									>
										Apply
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>
					<Popover open={showSortPopover} onOpenChange={setShowSortPopover}>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-9 w-9 flex-shrink-0 bg-zinc-800/50"
							>
								<ArrowUpDown className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-56" align="end">
							<div className="space-y-4">
								<h4 className="font-medium text-sm">Sort Chats</h4>
								<div className="space-y-2">
									<h5 className="text-muted-foreground text-xs">Sort by</h5>
									<div className="grid gap-1">
										{[
											{ label: "Last updated", value: "updated_at" },
											{ label: "Date created", value: "created_at" },
											{ label: "Position", value: "position" },
										].map((option) => (
											<Button
												key={option.value}
												variant="ghost"
												size="sm"
												className={cn(
													"justify-start font-normal",
													sortField === option.value && "bg-zinc-800",
												)}
												onClick={() =>
													setSortField(
														option.value as
															| "updated_at"
															| "created_at"
															| "position",
													)
												}
											>
												{option.label}
												{sortField === option.value && (
													<Check className="ml-auto h-4 w-4" />
												)}
											</Button>
										))}
									</div>
								</div>
								<div className="space-y-2">
									<h5 className="text-muted-foreground text-xs">Order</h5>
									<div className="grid gap-1">
										{[
											{ label: "Ascending", value: "asc" },
											{ label: "Descending", value: "desc" },
										].map((option) => (
											<Button
												key={option.value}
												variant="ghost"
												size="sm"
												className={cn(
													"justify-start font-normal",
													sortOrder === option.value && "bg-zinc-800",
												)}
												onClick={() =>
													setSortOrder(option.value as "asc" | "desc")
												}
											>
												{option.label}
												{sortOrder === option.value && (
													<Check className="ml-auto h-4 w-4" />
												)}
											</Button>
										))}
									</div>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* New chat button below the search row */}
				<Button
					variant="outline"
					size="sm"
					className="w-full border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50"
					onClick={handleCreateChat}
					disabled={creating}
				>
					<Plus className="mr-2 h-4 w-4" />
					New Chat
					{creating && (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						</div>
					)}
				</Button>
			</div>

			{/* Tab Navigation */}
			<div className="border-zinc-800 border-b">
				<Tabs
					defaultValue="all"
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full"
				>
					<TabsList className="grid h-10 grid-cols-3 p-0">
						<TabsTrigger
							value="all"
							className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent"
						>
							All
						</TabsTrigger>
						<TabsTrigger
							value="pinned"
							className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent"
						>
							<Pin className="mr-1 h-3.5 w-3.5" /> Pinned
						</TabsTrigger>
						<TabsTrigger
							value="archived"
							className="rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent"
						>
							<Archive className="mr-1 h-3.5 w-3.5" /> Archived
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Conversations List */}
			<div className="flex-1 overflow-auto">
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
									"group block rounded-md p-3 hover:bg-zinc-800/50",
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
														: "text-zinc-200",
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
												className="text-zinc-400 hover:text-zinc-200"
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
													className="text-zinc-400 hover:text-zinc-200"
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
													className="absolute top-full right-0 z-10 mt-1 hidden w-32 rounded-md bg-zinc-800 p-1 shadow-lg"
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
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
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
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
														onClick={(e) => openRenameDialog(e, session)}
													>
														<Pencil className="h-3.5 w-3.5" />
														<span>Rename</span>
													</button>

													{/* Archive/Unarchive option */}
													<button
														type="button"
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
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
													<div className="my-1 border-zinc-700 border-t" />

													{/* Delete option */}
													<button
														type="button"
														className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-red-400 text-xs hover:bg-zinc-700"
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
