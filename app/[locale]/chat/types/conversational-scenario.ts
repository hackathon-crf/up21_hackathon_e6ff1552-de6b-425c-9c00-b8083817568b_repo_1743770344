/**
 * Conversational Emergency Training System
 * Replaces rigid multiple-choice with free-form AI-guided learning
 */

import type { LucideIcon } from "lucide-react";

// Core scenario structure - much simpler than the rigid system
export interface ConversationalScenario {
	// Basic identification
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;

	// Learning context
	difficulty: "beginner" | "intermediate" | "advanced";
	estimatedDuration: number; // minutes

	// Rich situational context
	situation: {
		location: string;
		timeOfDay: string;
		weather?: string;
		people: Array<{
			name: string;
			age?: number;
			role: string;
			condition: string;
		}>;
		environment: string;
		urgency: "low" | "medium" | "high" | "critical";
		availableResources: string[];
		constraints: string[];
	};

	// Educational framework
	learningGoals: Array<{
		id: string;
		description: string;
		keyTopics: string[]; // Topics to cover naturally in conversation
	}>;

	// AI conversation prompts
	systemPrompt: string; // Base AI personality and role
	initialPrompt: string; // Opening scenario description
	guidingQuestions: Array<{
		topic: string;
		trigger: string; // When to ask this type of question
		examples: string[]; // Example Socratic questions
	}>;

	// Assessment through conversation
	assessmentCriteria: Array<{
		skill: string;
		indicators: string[]; // What to listen for in responses
		responses: {
			strong: string[]; // AI responses for good understanding
			developing: string[]; // AI responses for partial understanding
			needs_support: string[]; // AI responses for misconceptions
		};
	}>;

	// Natural conversation flow
	conversationStages: Array<{
		stage: string;
		description: string;
		objectives: string[];
		transitionTriggers: string[]; // Natural conversation cues to move forward
	}>;
}

// Simple state tracking for conversational scenarios
export interface ConversationalState {
	scenarioId: string;
	currentStage: number;
	startTime: Date;
	coveredTopics: string[];
	demonstratedSkills: string[];
	needsReview: string[];
	isActive: boolean;
	userResponses: Array<{
		question: string;
		response: string;
		timestamp: Date;
		aiAssessment?: string;
	}>;
}

// Progress tracking through natural conversation
export interface ConversationalProgress {
	userId: string;
	scenarioId: string;
	completedAt: Date;
	conversationSummary: string;
	skillsDemonstrated: string[];
	areasForImprovement: string[];
	aiRecommendations: string[];
	engagementLevel: "high" | "medium" | "low";
	nextSteps: string[];
}

// AI teaching strategies
export interface TeachingStrategy {
	name: string;
	description: string;
	triggers: string[]; // When to use this strategy
	techniques: string[]; // How to implement it
}

// Scenario library for conversational approach
export interface ConversationalScenarioLibrary {
	emergency: ConversationalScenario[];
	practice: ConversationalScenario[];
	review: ConversationalScenario[];
}
