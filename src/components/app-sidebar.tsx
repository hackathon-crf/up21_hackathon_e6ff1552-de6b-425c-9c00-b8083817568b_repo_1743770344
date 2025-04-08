"use client"
import Link from "next/link"
import type React from "react"

import { usePathname } from "next/navigation"
import {
  BookOpen,
  ChevronDown,
  Gamepad2,
  Heart,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  User,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold hidden md:inline">Red Cross Training</span>
          <span className="text-xl font-bold md:hidden">RC Training</span>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto py-2">
        {/* Navigation Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Navigation</h2>
          <div className="space-y-1">
            <NavItem href="/dashboard" icon={<Home className="h-4 w-4" />} isActive={isActive("/dashboard")}>
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Home</span>
            </NavItem>
            <NavItem href="/flashcards" icon={<BookOpen className="h-4 w-4" />} isActive={isActive("/flashcards")}>
              Flashcards
            </NavItem>
            <NavItem href="/chat" icon={<MessageSquare className="h-4 w-4" />} isActive={isActive("/chat")}>
              AI Assistant
            </NavItem>
            <NavItem href="/multiplayer" icon={<Gamepad2 className="h-4 w-4" />} isActive={isActive("/multiplayer")}>
              Multiplayer
            </NavItem>
          </div>
        </div>

        {/* Divider */}
        <div className="my-2 border-t mx-3" />

        {/* Training Categories Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Training Categories</h2>
          <div className="space-y-1">
            <NavItem href="/categories/cpr" icon={<Heart className="h-4 w-4" />} isActive={isActive("/categories/cpr")}>
              CPR & AED
            </NavItem>
            <NavItem
              href="/categories/first-aid"
              icon={<Shield className="h-4 w-4" />}
              isActive={isActive("/categories/first-aid")}
            >
              First Aid Basics
            </NavItem>
            <NavItem
              href="/categories/emergency"
              icon={<Shield className="h-4 w-4" />}
              isActive={isActive("/categories/emergency")}
            >
              Emergency Response
            </NavItem>
          </div>
        </div>

        {/* Divider */}
        <div className="my-2 border-t mx-3" />

        {/* Account Section */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">Account</h2>
          <div className="space-y-1">
            <NavItem href="/profile" icon={<User className="h-4 w-4" />} isActive={isActive("/profile")}>
              Profile
            </NavItem>
            <NavItem href="/settings" icon={<Settings className="h-4 w-4" />} isActive={isActive("/settings")}>
              Settings
            </NavItem>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-2 md:p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/avatar.svg?height=32&width=32" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <span className="truncate hidden sm:inline">John Doe</span>
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/auth/login" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Custom NavItem component that doesn't use nested list items
function NavItem({
  href,
  icon,
  children,
  isActive,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm font-medium ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
