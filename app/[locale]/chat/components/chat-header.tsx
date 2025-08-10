"use client";

import { Bell, Bot, Settings, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "~/components/language-switcher";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { Link } from "~/i18n/navigation";
import { ScenarioDialog } from "./scenario-dialog";
import type { Scenario } from "./scenario-picker-new";

interface ChatHeaderProps {
	title: string;
	description: string;
	onNewScenario?: () => void;
	onSelectScenario?: (scenario: Scenario) => void;
	showNewScenario?: boolean;
	showUtilityControls?: boolean;
}

export function ChatHeader({
	title,
	description,
	onNewScenario,
	onSelectScenario,
	showNewScenario = true,
	showUtilityControls = true,
}: ChatHeaderProps) {
	const tUi = useTranslations("chat.ui");
	const tCommon = useTranslations("common");

	return (
		<div className="flex items-center justify-between p-4">
			{/* Left side: AI Assistant branding */}
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<img src="/mascot.svg" alt="Mascot" className="h-5 w-5" />
				</div>
				<div className="hidden sm:block">
					<h1 className="font-semibold text-xl">{title}</h1>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
				<div className="sm:hidden">
					<h1 className="font-semibold text-lg">{title}</h1>
				</div>
			</div>

			{/* Right side: Controls grouped logically */}
			<div className="flex items-center gap-1">
				{/* Utility Controls Group */}
				{showUtilityControls && (
					<div className="mr-3 flex items-center gap-1">
						<div className="hidden items-center gap-1 sm:flex">
							<LanguageSwitcher />
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="outline" size="icon" className="h-9 w-9">
											<Bell className="h-4 w-4" />
											<span className="sr-only">
												{tCommon("notifications")}
											</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{tCommon("notifications")}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<ModeToggle />
						</div>
						{/* Mobile: Show only theme toggle */}
						<div className="sm:hidden">
							<ModeToggle />
						</div>
					</div>
				)}

				{/* Action Controls Group */}
				<div className="flex items-center gap-2">
					{showNewScenario && (onNewScenario || onSelectScenario) && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									{onSelectScenario ? (
										<ScenarioDialog onSelectScenario={onSelectScenario}>
											<Button
												size="icon"
												variant="outline"
												className="h-10 w-10 rounded-full shadow-md"
											>
												<Sparkles className="h-5 w-5" />
												<span className="sr-only">{tUi("newScenario")}</span>
											</Button>
										</ScenarioDialog>
									) : (
										<Button
											onClick={onNewScenario}
											size="icon"
											variant="outline"
											className="h-10 w-10 rounded-full shadow-md"
										>
											<Sparkles className="h-5 w-5" />
											<span className="sr-only">{tUi("newScenario")}</span>
										</Button>
									)}
								</TooltipTrigger>
								<TooltipContent side="bottom">
									{tUi("startNewScenario")}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}

					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									asChild
									size="icon"
									className="h-10 w-10 rounded-full shadow-md"
								>
									<Link href="/chat/settings">
										<Settings className="h-5 w-5" />
										<span className="sr-only">{tUi("chatSettings")}</span>
									</Link>
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{tUi("chatSettings")}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
	);
}
