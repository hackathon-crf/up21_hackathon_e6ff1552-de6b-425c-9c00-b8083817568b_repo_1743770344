import { Bell } from "lucide-react"

import { Button } from "~/components/ui/button"
import { ModeToggle } from "~/components/mode-toggle"

interface DashboardHeaderProps {
  title: string
  description?: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="border-b sticky top-0 z-10 bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:py-4 sm:px-6">
        <div className="mb-2 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          {description && <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </div>
  )
}
