"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";
import { useIsMobile } from "~/hooks/use-mobile";
import { type Scenario, ScenarioPicker } from "./scenario-picker-new";

interface ScenarioDialogProps {
	children: React.ReactNode;
	onSelectScenario: (scenario: Scenario) => void;
}

export function ScenarioDialog({
	children,
	onSelectScenario,
}: ScenarioDialogProps) {
	const [open, setOpen] = useState(false);
	const isMobile = useIsMobile();
	const t = useTranslations("scenarios.dialog");

	const handleScenarioSelect = (scenario: Scenario) => {
		onSelectScenario(scenario);
		setOpen(false);
	};

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>{children}</DrawerTrigger>
				<DrawerContent className="border-0 bg-transparent">
					<DrawerHeader className="sr-only">
						<DrawerTitle>{t("title")}</DrawerTitle>
						<DrawerDescription>{t("description")}</DrawerDescription>
					</DrawerHeader>
					<ScenarioPicker
						onSelectScenario={handleScenarioSelect}
						onClose={() => setOpen(false)}
						isOverlay={true}
					/>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
				<DialogHeader className="sr-only">
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<ScenarioPicker
					onSelectScenario={handleScenarioSelect}
					onClose={() => setOpen(false)}
					isOverlay={true}
				/>
			</DialogContent>
		</Dialog>
	);
}
