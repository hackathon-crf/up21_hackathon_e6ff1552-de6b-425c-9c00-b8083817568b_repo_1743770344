/**
 * Conversational Scenario Picker
 * Simple, clean interface for selecting conversation-based emergency training
 */

"use client";

import { motion } from "framer-motion";
import { GraduationCap, MessageCircle, Play, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { conversationalScenarios } from "../data/conversational-scenarios";
import type { ConversationalScenario } from "../types/conversational-scenario";

// Helper function to get localized scenario data
function useLocalizedScenarioData(scenarioId: string) {
	const t = useTranslations("scenarios.conversationalScenarios");

	const getTitle = () => {
		try {
			return t(`${scenarioId}.title`);
		} catch {
			return null;
		}
	};

	const getDescription = () => {
		try {
			return t(`${scenarioId}.description`);
		} catch {
			return null;
		}
	};

	const getLocation = () => {
		try {
			return t(`${scenarioId}.situation.location`);
		} catch {
			return null;
		}
	};

	const getLearningGoal = (goalId: string) => {
		try {
			return t(`${scenarioId}.learningGoals.${goalId}`);
		} catch {
			return null;
		}
	};

	return {
		getTitle,
		getDescription,
		getLocation,
		getLearningGoal,
	};
}

interface ConversationalScenarioPickerProps {
	onScenarioSelect: (scenario: ConversationalScenario) => void;
	className?: string;
}

interface ScenarioCardProps {
	scenario: ConversationalScenario;
	onSelect: (scenario: ConversationalScenario) => void;
	index: number;
}

function ScenarioCard({ scenario, onSelect, index }: ScenarioCardProps) {
	const t = useTranslations("scenarios");
	const tConversational = useTranslations("scenarios.conversational");
	const localizedData = useLocalizedScenarioData(scenario.id);

	const difficultyColors = {
		beginner: "bg-green-100 text-green-800 border-green-200",
		intermediate: "bg-orange-100 text-orange-800 border-orange-200",
		advanced: "bg-red-100 text-red-800 border-red-200",
	};

	const urgencyColors = {
		low: "text-green-600",
		medium: "text-yellow-600",
		high: "text-orange-600",
		critical: "text-red-600",
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
		>
			<Card
				className={cn(
					"group cursor-pointer transition-all duration-200 hover:border-red-300 hover:shadow-lg",
					"flex h-full flex-col border border-gray-200",
				)}
				onClick={() => onSelect(scenario)}
			>
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 transition-colors group-hover:bg-red-200">
								<scenario.icon className="h-5 w-5 text-red-600" />
							</div>
							<div className="flex-1">
								<CardTitle className="text-lg leading-tight">
									{localizedData.getTitle() || scenario.title}
								</CardTitle>
								<div className="mt-1 flex items-center gap-2">
									<Badge
										variant="outline"
										className={cn(
											"text-xs",
											difficultyColors[scenario.difficulty],
										)}
									>
										{t(`difficulty.${scenario.difficulty}`)}
									</Badge>
									<div className="flex items-center gap-1 text-gray-500">
										<Timer className="h-3 w-3" />
										<span className="text-xs">
											{scenario.estimatedDuration}m
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="flex flex-1 flex-col">
					{/* Content that can grow */}
					<div className="flex-1 space-y-4">
						<CardDescription className="text-sm leading-relaxed">
							{localizedData.getDescription() || scenario.description}
						</CardDescription>

						{/* Situation Summary */}
						<div className="space-y-2 rounded-lg bg-gray-50 p-3">
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-gray-400" />
								<span className="font-medium text-gray-700 text-sm">
									{localizedData.getLocation() || scenario.situation.location}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<div
									className={cn(
										"h-2 w-2 rounded-full",
										urgencyColors[scenario.situation.urgency].replace(
											"text-",
											"bg-",
										),
									)}
								/>
								<span
									className={cn(
										"font-medium text-sm capitalize",
										urgencyColors[scenario.situation.urgency],
									)}
								>
									{t(`urgency.${scenario.situation.urgency}`)}
								</span>
							</div>
						</div>

						{/* Learning Goals Preview */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<GraduationCap className="h-4 w-4 text-gray-500" />
								<span className="font-medium text-gray-700 text-sm">
									{tConversational("learningGoals")}
								</span>
							</div>
							<div className="space-y-1">
								{scenario.learningGoals.slice(0, 2).map((goal) => (
									<div key={goal.id} className="flex items-start gap-2">
										<div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
										<span className="text-gray-600 text-xs leading-relaxed">
											{localizedData.getLearningGoal(goal.id) ||
												goal.description}
										</span>
									</div>
								))}
								{scenario.learningGoals.length > 2 && (
									<div className="ml-3 text-gray-500 text-xs">
										+{scenario.learningGoals.length - 2} more objectives
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Button always at bottom */}
					<div className="mt-6">
						<Button
							className="w-full bg-red-600 text-white transition-colors hover:bg-red-700"
							onClick={(e) => {
								e.stopPropagation();
								onSelect(scenario);
							}}
						>
							<Play className="mr-2 h-4 w-4" />
							{tConversational("startTraining")}
						</Button>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

export function ConversationalScenarioPicker({
	onScenarioSelect,
	className,
}: ConversationalScenarioPickerProps) {
	const tScenarios = useTranslations("chat.scenarios");

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className={cn("mx-auto w-full max-w-4xl p-6", className)}
		>
			{/* Header */}
			<div className="mb-8 text-center">
				<h2 className="mb-2 font-bold text-2xl text-gray-900">
					{tScenarios("emergencyTraining")}
				</h2>
				<p className="mx-auto max-w-2xl text-gray-600">
					{tScenarios("description")}
				</p>
				<div className="mt-4 flex items-center justify-center gap-4 text-gray-500 text-sm">
					<div className="flex items-center gap-2">
						<MessageCircle className="h-4 w-4" />
						<span>{tScenarios("conversationalLearning")}</span>
					</div>
					<div className="flex items-center gap-2">
						<GraduationCap className="h-4 w-4" />
						<span>{tScenarios("guidedReflection")}</span>
					</div>
				</div>
			</div>

			{/* Scenarios Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
				{conversationalScenarios.map((scenario, index) => (
					<ScenarioCard
						key={scenario.id}
						scenario={scenario}
						onSelect={onScenarioSelect}
						index={index}
					/>
				))}
			</div>

			{/* Footer Note */}
			<div className="mt-8 text-center">
				<p className="text-gray-500 text-sm">
					{tScenarios("adaptiveDescription")}
				</p>
			</div>
		</motion.div>
	);
}
