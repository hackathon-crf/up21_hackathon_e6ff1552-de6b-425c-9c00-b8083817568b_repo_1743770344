"use client";
import {
	BookCheck,
	BookOpen,
	BookX,
	ChevronDown,
	Gamepad2,
	Home,
	LogOut,
	MessageSquare,
	Settings,
	Shield,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

export function AppSidebar() {
	const pathname = usePathname();

	const isActive = (path: string) => {
		return pathname === path || pathname.startsWith(`${path}/`);
	};

	return (
		<nav
			className="flex h-full w-64 flex-col border-r bg-gradient-to-b from-background to-background/95 backdrop-blur-sm"
			aria-label="Main Navigation"
		>
			{/* App Brand Header */}
			<div className="relative overflow-hidden border-b bg-primary/5 bg-red px-4 py-4">
				<div className="-right-6 -top-6 absolute h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
				<div className="-left-10 -bottom-8 absolute h-20 w-20 rounded-full bg-primary/10 blur-3xl" />

				<div className="relative flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
						<img
							src="/mascot.svg"
							alt="Red Cross Mascot"
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="flex flex-col">
						<span className="font-bold text-foreground text-lg tracking-tight">
							Red Cross
						</span>
						<span className="font-medium text-muted-foreground text-xs">
							Training Platform
						</span>
					</div>
				</div>
			</div>

			{/* Navigation Content */}
			<div className="flex-1 overflow-auto px-3 py-6">
				{/* Main Navigation Group */}
				<div className="space-y-6">
					<NavigationGroup label="Main">
						<NavItem
							href="/dashboard"
							icon={<Home className="h-4 w-4" aria-hidden="true" />}
							isActive={isActive("/dashboard")}
						>
							Dashboard
						</NavItem>
						<NavItem
							href="/flashcards"
							icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
							isActive={isActive("/flashcards")}
							badge="12"
							badgeLabel="12 flashcards available"
							badgeColor="bg-red-500"
						>
							Flashcards
						</NavItem>
						<NavItem
							href="/chat"
							icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
							isActive={isActive("/chat")}
							badge="New"
							badgeColor="bg-blue-500"
							badgeLabel="New feature"
						>
							AI Assistant
						</NavItem>
						<NavItem
							href="/multiplayer"
							icon={<Gamepad2 className="h-4 w-4" aria-hidden="true" />}
							isActive={isActive("/multiplayer")}
							badge="5"
							badgeColor="bg-green-500"
							badgeLabel="5 active games"
						>
							Multiplayer
						</NavItem>
					</NavigationGroup>
				</div>
			</div>

			{/* User Profile Footer */}
			<div className="border-border/50 border-t bg-muted/30 p-3">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="w-full justify-between gap-3 rounded-xl bg-background/80 px-3 py-5 shadow-sm transition-all hover:bg-background hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
							aria-label="User menu"
						>
							<div className="flex items-center gap-3">
								<Avatar className="h-9 w-9 border-2 border-background shadow-sm">
									<AvatarImage src="/avatar.svg?height=36&width=36" alt="" />
									<AvatarFallback className="bg-primary/10 text-primary">
										JD
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col items-start text-left">
									<span className="font-medium text-sm">John Doe</span>
									<span className="text-muted-foreground text-xs">
										Instructor
									</span>
								</div>
							</div>
							<ChevronDown
								className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180"
								aria-hidden="true"
							/>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
						<DropdownMenuItem
							asChild
							className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5"
						>
							<Link href="/profile" className="flex w-full items-center gap-2">
								<User
									className="h-4 w-4 text-muted-foreground"
									aria-hidden="true"
								/>
								<span>Profile</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							asChild
							className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5"
						>
							<Link href="/settings" className="flex w-full items-center gap-2">
								<Settings
									className="h-4 w-4 text-muted-foreground"
									aria-hidden="true"
								/>
								<span>Settings</span>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							asChild
							className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
						>
							<Link
								href="/auth/login"
								className="flex w-full items-center gap-2"
							>
								<LogOut className="h-4 w-4" aria-hidden="true" />
								<span>Log out</span>
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</nav>
	);
}

// Navigation Group component for better organization
function NavigationGroup({
	label,
	children,
}: { label: string; children: React.ReactNode }) {
	return (
		<div className="space-y-1.5">
			<h2 className="mb-3 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
				{label}
			</h2>
			{children}
		</div>
	);
}

// Enhanced NavItem component with accessibility improvements
function NavItem({
	href,
	icon,
	children,
	isActive,
	badge,
	badgeColor = "bg-primary",
	badgeLabel,
}: {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	isActive: boolean;
	badge?: string;
	badgeColor?: string;
	badgeLabel?: string;
}) {
	const linkRef = useRef<HTMLAnchorElement>(null);

	// Auto-focus active navigation item on page load for keyboard users
	useEffect(() => {
		if (isActive && linkRef.current) {
			linkRef.current.focus({ preventScroll: true });
		}
	}, [isActive]);

	return (
		<Link
			ref={linkRef}
			href={href}
			className={cn(
				"group block outline-none",
				"focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
				"rounded-xl transition-all",
			)}
			aria-current={isActive ? "page" : undefined}
		>
			<div
				className={cn(
					"relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-all duration-200",
					isActive
						? "bg-primary text-primary-foreground shadow-md"
						: "text-foreground hover:bg-muted/80",
				)}
			>
				{/* Animated background for active state with reduced motion option */}
				{isActive && (
					<>
						<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary opacity-80" />
						<div
							className={cn(
								"-right-1 -top-1 absolute h-3 w-3 rounded-full bg-primary/30 blur-sm",
								"@media (prefers-reduced-motion: reduce) { opacity: 0 }",
							)}
						/>
						<div
							className={cn(
								"-left-1 -bottom-1 absolute h-3 w-3 rounded-full bg-primary/30 blur-sm",
								"@media (prefers-reduced-motion: reduce) { opacity: 0 }",
							)}
						/>
					</>
				)}

				{/* Icon with improved contrast */}
				<div
					className={cn(
						"relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
						isActive
							? "bg-white/20 text-primary-foreground"
							: "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground",
					)}
				>
					{icon}
				</div>

				{/* Text with improved positioning */}
				<span className="relative z-10 flex-1">{children}</span>

				{/* Badge with accessibility improvements */}
				{badge && (
					<span
						className={`relative z-10 rounded-full ${badgeColor} px-2 py-0.5 font-semibold text-white text-xs`}
						aria-label={badgeLabel || badge}
					>
						{badge}
					</span>
				)}
			</div>
		</Link>
	);
}
