/**
 * Unified System Prompt Management
 * Central place for all AI system prompts to ensure consistency
 */

export interface SystemPromptOptions {
	context?: "chat" | "scenario" | "streaming";
	scenarioSystemPrompt?: string;
	userProgress?: {
		coveredTopics?: string[];
		demonstratedSkills?: string[];
		currentStage?: string;
		stageDescription?: string;
		stageObjectives?: string[];
	};
}

/**
 * Base system prompt for Red Cross AI assistant
 */
const BASE_SYSTEM_PROMPT =
	"You are a helpful Red Cross AI assistant. Answer questions about first aid and emergency response concisely and accurately. Provide reliable information based on official Red Cross guidelines.";

/**
 * Enhanced system prompt for conversational training scenarios
 */
const SCENARIO_ENHANCEMENT = `

When engaged in scenario-based training:
- Create immersion through vivid scene descriptions
- Use Socratic questioning instead of giving direct answers
- Encourage reflection and critical thinking
- Adapt guidance based on user knowledge level
- Build confidence while gently correcting mistakes
- Respond as if the emergency is happening in real-time`;

/**
 * Generate the appropriate system prompt based on context
 */
export function getSystemPrompt(options: SystemPromptOptions = {}): string {
	const { context, scenarioSystemPrompt, userProgress } = options;

	// For conversational scenarios, use the scenario-specific prompt
	if (context === "scenario" && scenarioSystemPrompt) {
		let prompt = scenarioSystemPrompt;

		// Add current stage and progress information
		if (userProgress) {
			const {
				currentStage,
				stageDescription,
				stageObjectives,
				coveredTopics,
				demonstratedSkills,
			} = userProgress;

			if (currentStage && stageDescription) {
				prompt += `\n\nCurrent Stage: ${currentStage} - ${stageDescription}`;
				if (stageObjectives && stageObjectives.length > 0) {
					prompt += `\nObjectives: ${stageObjectives.join(", ")}`;
				}
			}

			if (
				(coveredTopics && coveredTopics.length > 0) ||
				(demonstratedSkills && demonstratedSkills.length > 0)
			) {
				prompt += "\n\nUser Progress:";
				if (coveredTopics && coveredTopics.length > 0) {
					prompt += `\n- Covered topics: ${coveredTopics.join(", ")}`;
				}
				if (demonstratedSkills && demonstratedSkills.length > 0) {
					prompt += `\n- Demonstrated skills: ${demonstratedSkills.join(", ")}`;
				}
			}
		}

		prompt +=
			"\n\nRemember: Guide through Socratic questioning, encourage reflection, and adapt to their knowledge level. Respond to their actions realistically as if this emergency is happening right now.";

		return prompt;
	}

	// For all other contexts, use base prompt with scenario enhancement if needed
	let prompt = BASE_SYSTEM_PROMPT;

	if (context === "scenario") {
		prompt += SCENARIO_ENHANCEMENT;
	}

	return prompt;
}

/**
 * Get system prompt for chat router
 */
export function getChatSystemPrompt(): string {
	return getSystemPrompt({ context: "chat" });
}

/**
 * Get system prompt for streaming API
 */
export function getStreamingSystemPrompt(
	scenarioSystemPrompt?: string,
): string {
	if (scenarioSystemPrompt) {
		return getSystemPrompt({
			context: "scenario",
			scenarioSystemPrompt,
		});
	}
	return getSystemPrompt({ context: "streaming" });
}

/**
 * Get system prompt for conversational scenarios
 */
export function getScenarioSystemPrompt(
	scenarioSystemPrompt: string,
	userProgress?: SystemPromptOptions["userProgress"],
): string {
	return getSystemPrompt({
		context: "scenario",
		scenarioSystemPrompt,
		userProgress,
	});
}
