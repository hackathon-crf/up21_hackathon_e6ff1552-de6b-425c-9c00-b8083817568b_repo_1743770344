/**
 * Conversational Scenario State Management
 * Simple state tracking for free-form scenario conversations
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getScenarioSystemPrompt } from "~/lib/prompts/system-prompts";
import type {
	ConversationalProgress,
	ConversationalScenario,
	ConversationalState,
} from "../types/conversational-scenario";

interface ConversationalScenarioStore {
	// Current scenario state
	currentScenario: ConversationalScenario | null;
	scenarioState: ConversationalState | null;
	isScenarioActive: boolean;

	// Conversation tracking
	currentStage: number;
	coveredTopics: string[];
	demonstratedSkills: string[];
	needsReview: string[];

	// Actions
	startScenario: (scenario: ConversationalScenario) => void;
	endScenario: () => void;
	addCoveredTopic: (topic: string) => void;
	addDemonstratedSkill: (skill: string) => void;
	addNeedsReview: (topic: string) => void;
	advanceStage: () => void;
	recordUserResponse: (
		question: string,
		response: string,
		aiAssessment?: string,
	) => void;

	// Getters
	getCurrentStage: () => unknown;
	getProgress: () => ConversationalProgress | null;
	shouldAdvanceStage: (userMessage: string) => boolean;
	generateScenarioPrompt: () => string;
	getRelevantGuidingQuestions: () => string[];
}

export const useConversationalScenarioStore =
	create<ConversationalScenarioStore>()(
		devtools(
			(set, get) => ({
				// Initial state
				currentScenario: null,
				scenarioState: null,
				isScenarioActive: false,
				currentStage: 0,
				coveredTopics: [],
				demonstratedSkills: [],
				needsReview: [],

				// Start a conversational scenario
				startScenario: (scenario: ConversationalScenario) => {
					const initialState: ConversationalState = {
						scenarioId: scenario.id,
						currentStage: 0,
						startTime: new Date(),
						coveredTopics: [],
						demonstratedSkills: [],
						needsReview: [],
						isActive: true,
						userResponses: [],
					};

					set({
						currentScenario: scenario,
						scenarioState: initialState,
						isScenarioActive: true,
						currentStage: 0,
						coveredTopics: [],
						demonstratedSkills: [],
						needsReview: [],
					});
				},

				// End the current scenario
				endScenario: () => {
					const { scenarioState } = get();
					if (!scenarioState) return;

					const updatedState = {
						...scenarioState,
						isActive: false,
					};

					set({
						scenarioState: updatedState,
						isScenarioActive: false,
					});
				},

				// Track learning progress
				addCoveredTopic: (topic: string) => {
					const { coveredTopics, scenarioState } = get();
					if (!coveredTopics.includes(topic)) {
						const updatedTopics = [...coveredTopics, topic];
						set({
							coveredTopics: updatedTopics,
							scenarioState: scenarioState
								? { ...scenarioState, coveredTopics: updatedTopics }
								: null,
						});
					}
				},

				addDemonstratedSkill: (skill: string) => {
					const { demonstratedSkills, scenarioState } = get();
					if (!demonstratedSkills.includes(skill)) {
						const updatedSkills = [...demonstratedSkills, skill];
						set({
							demonstratedSkills: updatedSkills,
							scenarioState: scenarioState
								? { ...scenarioState, demonstratedSkills: updatedSkills }
								: null,
						});
					}
				},

				addNeedsReview: (topic: string) => {
					const { needsReview, scenarioState } = get();
					if (!needsReview.includes(topic)) {
						const updatedReview = [...needsReview, topic];
						set({
							needsReview: updatedReview,
							scenarioState: scenarioState
								? { ...scenarioState, needsReview: updatedReview }
								: null,
						});
					}
				},

				// Advance conversation stage
				advanceStage: () => {
					const { currentScenario, currentStage, scenarioState } = get();
					if (!currentScenario || !scenarioState) return;

					const nextStage = Math.min(
						currentStage + 1,
						currentScenario.conversationStages.length - 1,
					);

					set({
						currentStage: nextStage,
						scenarioState: {
							...scenarioState,
							currentStage: nextStage,
						},
					});
				},

				// Record user responses for assessment
				recordUserResponse: (
					question: string,
					response: string,
					aiAssessment?: string,
				) => {
					const { scenarioState } = get();
					if (!scenarioState) return;

					const newResponse = {
						question,
						response,
						timestamp: new Date(),
						aiAssessment,
					};

					const updatedResponses = [
						...scenarioState.userResponses,
						newResponse,
					];

					set({
						scenarioState: {
							...scenarioState,
							userResponses: updatedResponses,
						},
					});
				},

				// Getters
				getCurrentStage: () => {
					const { currentScenario, currentStage } = get();
					if (!currentScenario) return null;
					return currentScenario.conversationStages[currentStage] || null;
				},

				getProgress: () => {
					const { scenarioState, demonstratedSkills, needsReview } = get();
					if (!scenarioState) return null;

					return {
						userId: "current-user", // Would come from auth context
						scenarioId: scenarioState.scenarioId,
						completedAt: new Date(),
						conversationSummary: "", // Would be generated by AI
						skillsDemonstrated: demonstratedSkills,
						areasForImprovement: needsReview,
						aiRecommendations: [], // Would be generated based on performance
						engagementLevel: "high" as const, // Would be assessed from conversation
						nextSteps: [], // Would be generated by AI
					};
				},

				// Determine if conversation should advance to next stage
				shouldAdvanceStage: (userMessage: string) => {
					const { currentScenario, currentStage } = get();
					if (!currentScenario) return false;

					const stage = currentScenario.conversationStages[currentStage];
					if (!stage) return false;

					// Check if user message contains stage transition triggers
					return stage.transitionTriggers.some((trigger) =>
						userMessage.toLowerCase().includes(trigger.toLowerCase()),
					);
				},

				// Generate enhanced AI prompt based on current scenario state
				generateScenarioPrompt: () => {
					const {
						currentScenario,
						currentStage,
						coveredTopics,
						demonstratedSkills,
					} = get();
					if (!currentScenario) return "";

					const stage = currentScenario.conversationStages[currentStage];
					const userProgress = {
						coveredTopics,
						demonstratedSkills,
						currentStage: stage?.stage,
						stageDescription: stage?.description,
						stageObjectives: stage?.objectives,
					};

					return getScenarioSystemPrompt(
						currentScenario.systemPrompt,
						userProgress,
					);
				},

				// Get relevant guiding questions for current stage
				getRelevantGuidingQuestions: () => {
					const { currentScenario, currentStage } = get();
					if (!currentScenario) return [];

					const stage = currentScenario.conversationStages[currentStage];
					if (!stage) return [];

					// Find guiding questions that match current stage objectives
					return currentScenario.guidingQuestions
						.filter((q) =>
							stage.objectives.some((obj) =>
								obj.toLowerCase().includes(q.topic.toLowerCase()),
							),
						)
						.flatMap((q) => q.examples);
				},
			}),
			{
				name: "conversational-scenario-store",
			},
		),
	);
