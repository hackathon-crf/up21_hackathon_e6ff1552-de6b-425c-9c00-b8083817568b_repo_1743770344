/**
 * Conversational Emergency Training Scenarios
 * Uses Socratic questioning and natural dialogue for immersive learning
 */

import {
	AlertTriangle,
	Baby,
	Car,
	Flame,
	Heart,
	Home,
	Mountain,
	Phone,
	Waves,
	Zap,
} from "lucide-react";
import type { ConversationalScenario } from "../types/conversational-scenario";

export const conversationalScenarios: ConversationalScenario[] = [
	{
		id: "office-cardiac-arrest",
		title: "Office Cardiac Emergency",
		description:
			"A colleague collapses at work - guide your emergency response through natural conversation",
		icon: Heart,
		difficulty: "intermediate",
		estimatedDuration: 15,

		situation: {
			location: "Open office space, 3rd floor of downtown building",
			timeOfDay: "2:30 PM on a Tuesday",
			weather: "Clear, comfortable indoor temperature",
			people: [
				{
					name: "David",
					age: 52,
					role: "Marketing Director",
					condition: "Unconscious, not breathing normally, no pulse",
				},
				{
					name: "Sarah",
					role: "Coworker",
					condition: "Witnessed collapse, very distressed",
				},
			],
			environment:
				"Busy office with 20+ people, conference rooms nearby, elevator access",
			urgency: "critical",
			availableResources: [
				"Office phone system",
				"AED in break room",
				"First aid kit in kitchen",
				"Multiple potential helpers nearby",
			],
			constraints: [
				"Limited medical training among staff",
				"Need to manage crowd of concerned coworkers",
				"Elevator may be slow for paramedics",
			],
		},

		learningGoals: [
			{
				id: "scene-safety",
				description: "Assess scene safety and take control of the situation",
				keyTopics: [
					"environmental hazards",
					"crowd control",
					"leadership in emergencies",
				],
			},
			{
				id: "primary-assessment",
				description: "Quickly assess responsiveness and breathing",
				keyTopics: [
					"checking consciousness",
					"airway assessment",
					"recognizing cardiac arrest",
				],
			},
			{
				id: "cpr-technique",
				description: "Demonstrate proper CPR technique and coordination",
				keyTopics: [
					"chest compressions",
					"rescue breathing",
					"compression depth and rate",
				],
			},
			{
				id: "aed-use",
				description: "Effectively use an AED when available",
				keyTopics: [
					"AED operation",
					"electrode placement",
					"safety during shock",
				],
			},
		],

		systemPrompt: `# Simulateur de scénarios PSC (Premier Secours Citoyen)

## 🎭 Rôle :
Tu es un **simulateur de formation immersif** pour des citoyens formés aux gestes de premiers secours (PSC1). Tu incarnes un formateur expérimenté en situations d'urgence, guidant l'apprenant à travers des scénarios réalistes. 

Tu ne donnes **jamais** directement la bonne réponse : tu questionnes, tu amènes à réfléchir, tu encourages. Tu utilises une approche **socratique** pour renforcer la compréhension et l'autonomie.

---

## 🎯 Mission :
Faire vivre des **scénarios progressifs, chronologiques et réalistes**, à la portée d'un citoyen sauveteur, avec le matériel usuel accessible au grand public (gants, masque de protection, couverture de survie, défibrillateur si disponible, etc.).

---

## 🧠 Progression pédagogique :
Tu structures le scénario autour de trois grandes étapes, en adaptant ton niveau d'accompagnement à la confiance et la justesse des réponses :

### 1. Sécurisation et alerte
- Aider à évaluer les dangers, se protéger, et alerter les secours (15/112).
- Amener l'apprenant à penser sécurité avant action.
- Socratiser : « Qu'est-ce qui pourrait être dangereux ici ? », « Comment peux-tu éviter d'aggraver la situation ? »

### 2. Gestes prioritaires
- Guider vers l'évaluation de la conscience, de la respiration, et vers les gestes vitaux (PLS, RCP, DAE, compression…).
- Toujours poser des questions clés : « Que remarques-tu ? », « Qu'est-ce qui te semble le plus urgent ? », « Que ferais-tu pour confirmer s'il respire ? »

### 3. Confort et suivi
- Surveillance de la victime, couverture, dialogue apaisant, jusqu'à l'arrivée des secours.
- Encourager la prise d'initiative et la bienveillance : « Comment rassurerais-tu cette personne ? », « Que peux-tu faire pendant que tu attends les secours ? »

---

## 🔄 Fonctionnement détaillé :

### 🔹 Étape 1 - Début du scénario :
Commence toujours par demander :
- Quel niveau de difficulté souhaites-tu ? *(facile / moyen / avancé)*  
- Quel type d'environnement ou de problème médical veux-tu ? *(rue, domicile, lieu public / traumatisme, malaise, arrêt cardiaque, etc.)*

### 🔹 Étape 2 - Création du scénario initial :
À partir des réponses :
- Propose un **scénario crédible** pour un citoyen sauveteur.
- Décris la situation avec **immersion** : lieu, ambiance, bruits, témoins, etc.
- Donne le **genre** et l'**âge** de la victime (ex. : une femme de 67 ans).
- Mentionne le **matériel disponible** (souvent limité).
- Termine par la question : **« Que fais-tu ? »**

### 🔹 Étape 3 - Réponses de l'utilisateur :
À chaque réponse de l'utilisateur :
- **Fais évoluer la situation** (amélioration, stabilisation, aggravation, imprévus simples).
- **Utilise le questionnement socratique** pour évaluer et renforcer la compréhension.
- **Ne donne jamais la bonne réponse directement**. Si la réponse est :
  - **Juste ou pertinente** → Encourage, félicite, poursuis la situation.
  - **Partiellement bonne ou incomplète** → Valorise ce qui est juste et **relance avec une question** :  
    *« Tu as couvert la victime, c'est bien. Mais as-tu pensé à vérifier autre chose avant cela ? »*
  - **Dangereuse ou totalement erronée** → Avertis **poliment**, **n'explique pas**, et **redemande la même étape** :
    *« Attention, ce geste pourrait aggraver la situation. Que pourrais-tu faire d'autre à ce moment précis ? »*

### 🔹 Étape 4 - Répétition du cycle :
Continue la simulation **sur plusieurs échanges**, selon les étapes clés d'une prise en charge PSC1.
Termine chaque échange par : **« Que fais-tu ? »**

---

## 📦 Imprévus pédagogiques (optionnels, selon difficulté) :
- Un témoin paniqué ou inutile
- Du matériel manquant ou défectueux
- La victime qui change soudainement d'état (perd connaissance, arrête de respirer, vomit…)

---

## ✅ Fin du scénario :
Quand la situation est résolue (secours arrivés, victime stabilisée, etc.) :
- Fais un **récapitulatif pédagogique** clair :
  - Ce que l'utilisateur a bien fait
  - Ce qu'il aurait pu améliorer
- Termine par une **appréciation globale**, **sans note chiffrée**, mais valorisante et formatrice.

---

## 🔔 Rappels importants :
- Tu restes dans une **logique pédagogique immersive**, sans jamais te substituer à un professionnel ou à un avis médical réel.
- Tu ne donnes **jamais** la bonne action en cas d'erreur : tu relances par une **question ouverte** sur la même étape.
- L'appréciation finale n'arrive **qu'après** la résolution complète du scénario.

---

## ▶️ Lancement :
Commence immédiatement avec :

**« Quel niveau de difficulté souhaites-tu ? (facile, moyen ou avancé) »**  
**« Et dans quel environnement ou face à quel type de problème médical veux-tu intervenir ? (rue, domicile, lieu public / malaise, traumatisme, arrêt cardiaque…) »**
`,

		initialPrompt: `Tu es en train de travailler à ton bureau lorsque tu entends Sarah crier de l'autre côté du bureau. Tu lèves les yeux et vois David, le directeur marketing, allongé sans bouger par terre à côté de son bureau. Sarah est agenouillée à côté de lui, elle lui secoue l'épaule et crie son nom de façon paniquée. Quelques autres collègues commencent à se rassembler autour, l'air inquiet et confus.

David semble complètement inconscient. Ses yeux sont fermés, et de là où tu es, tu ne vois pas sa poitrine bouger. L'atmosphère au bureau devient tendue -- certaines personnes commencent à paniquer, d'autres restent figées, ne sachant pas quoi faire.

Qu'est-ce qui te passe par la tête en ce moment ? Que penses-tu qu'il devrait se passer maintenant ?`,

		guidingQuestions: [
			{
				topic: "scene-assessment",
				trigger: "initial response",
				examples: [
					"Before you do anything else, what would you want to check about the environment around David?",
					"What might be dangerous about having lots of people crowding around right now?",
					"How could you make sure this area is safe for everyone?",
				],
			},
			{
				topic: "responsiveness-check",
				trigger: "approaching victim",
				examples: [
					"How would you determine if David is truly unconscious?",
					"What's a safe but effective way to check if someone is responsive?",
					"What would you be looking and listening for?",
				],
			},
			{
				topic: "breathing-assessment",
				trigger: "after responsiveness check",
				examples: [
					"Now that you've confirmed he's unresponsive, what's the next critical thing to assess?",
					"How can you tell if someone is breathing effectively?",
					"What would normal breathing look like versus what you're seeing?",
				],
			},
			{
				topic: "calling-for-help",
				trigger: "recognizing emergency",
				examples: [
					"At what point do you think emergency services should be called?",
					"Who could help you with that while you focus on David?",
					"What specific information would be most important to give the dispatcher?",
				],
			},
			{
				topic: "cpr-decision",
				trigger: "no pulse/breathing",
				examples: [
					"Given what you've observed about David's condition, what intervention does he need most urgently?",
					"What would happen to his brain and organs if we don't act quickly?",
					"Where on his chest would you place your hands, and why there specifically?",
				],
			},
		],

		assessmentCriteria: [
			{
				skill: "Scene Safety",
				indicators: [
					"mentions crowd control",
					"assesses environment",
					"takes charge",
				],
				responses: {
					strong: [
						"Excellent thinking! Taking control of the scene and managing the crowd is crucial - it shows real leadership in an emergency.",
						"That's exactly right. Scene safety isn't just about physical hazards, it's about creating the right environment for effective care.",
					],
					developing: [
						"Good awareness of the situation. How might you ensure other people don't interfere with your care?",
						"You're on the right track. What could happen if too many people crowd around David right now?",
					],
					needs_support: [
						"It's natural to focus on the victim first, but what about the environment around you? How might other people affect your ability to help David?",
						"Let's think about the bigger picture here. What could make this situation more challenging if we don't manage it properly?",
					],
				},
			},
			{
				skill: "Primary Assessment",
				indicators: [
					"checks responsiveness",
					"assesses breathing",
					"recognizes cardiac arrest",
				],
				responses: {
					strong: [
						"Perfect systematic approach! Checking responsiveness first, then breathing - that's exactly how professionals do it.",
						"You've quickly identified the key signs of cardiac arrest. That rapid assessment could save his life.",
					],
					developing: [
						"Good start with checking responsiveness. What else would tell you about David's condition right now?",
						"You're assessing well. How can you be certain about his breathing status?",
					],
					needs_support: [
						"Let's slow down and be systematic. If someone is unresponsive, what's the very first thing you should check?",
						"What are the signs that would tell you someone needs immediate life-saving intervention?",
					],
				},
			},
			{
				skill: "CPR Knowledge",
				indicators: [
					"proper hand placement",
					"compression depth",
					"rate understanding",
				],
				responses: {
					strong: [
						"Excellent technique! You clearly understand the importance of proper compressions - that's what will keep blood flowing to his brain.",
						"Perfect! That compression rate and depth will give David the best chance of survival.",
					],
					developing: [
						"Good start with CPR. How deep should those compressions be, and why is that important?",
						"You're doing compressions - what's the ideal rate that balances effectiveness with your ability to sustain it?",
					],
					needs_support: [
						"CPR is crucial here. Where exactly on the chest should you compress, and what's the reasoning behind that placement?",
						"Let's think about CPR technique. What's happening inside David's body when you compress his chest?",
					],
				},
			},
		],

		conversationStages: [
			{
				stage: "Initial Response",
				description: "User notices emergency and must take initial action",
				objectives: [
					"Recognize the emergency",
					"Approach safely",
					"Take control",
				],
				transitionTriggers: [
					"moves toward victim",
					"calls for help",
					"assesses scene",
				],
			},
			{
				stage: "Primary Assessment",
				description: "Systematic evaluation of victim's condition",
				objectives: [
					"Check responsiveness",
					"Assess breathing",
					"Recognize cardiac arrest",
				],
				transitionTriggers: [
					"completes assessment",
					"identifies no pulse/breathing",
				],
			},
			{
				stage: "Emergency Response",
				description: "Implementing life-saving interventions",
				objectives: ["Call 911", "Begin CPR", "Coordinate with others"],
				transitionTriggers: ["starts CPR", "someone calls 911", "requests AED"],
			},
			{
				stage: "Advanced Care",
				description: "Using available equipment and managing ongoing care",
				objectives: ["Apply AED", "Continue CPR cycles", "Prepare for EMS"],
				transitionTriggers: [
					"AED arrives",
					"discusses EMS arrival",
					"reflects on care",
				],
			},
			{
				stage: "Reflection & Learning",
				description: "Discussing the scenario and learning outcomes",
				objectives: [
					"Reflect on decisions",
					"Identify learning points",
					"Plan next steps",
				],
				transitionTriggers: [
					"expresses completion",
					"asks about outcome",
					"discusses next scenarios",
				],
			},
		],
	},

	{
		id: "child-choking",
		title: "Choking Child at Restaurant",
		description:
			"A toddler is choking at a family restaurant - navigate this high-pressure emergency",
		icon: Baby,
		difficulty: "intermediate",
		estimatedDuration: 10,

		situation: {
			location: "Busy family restaurant during dinner rush",
			timeOfDay: "6:00 PM on a Saturday",
			weather: "Indoor dining area, crowded and noisy",
			people: [
				{
					name: "Emma",
					age: 2,
					role: "Toddler",
					condition: "Choking on food, cannot cough or make sounds",
				},
				{
					name: "Parents",
					role: "Emma's parents",
					condition: "Panicking, unsure what to do",
				},
			],
			environment:
				"Crowded restaurant with many families, limited space between tables",
			urgency: "critical",
			availableResources: [
				"Restaurant staff",
				"Other patrons",
				"Restaurant phone",
			],
			constraints: [
				"Very limited time",
				"Panicked parents",
				"Crowded space",
				"Noise level",
			],
		},

		learningGoals: [
			{
				id: "recognize-choking",
				description: "Quickly identify severe choking in a child",
				keyTopics: ["choking signs", "partial vs complete obstruction"],
			},
			{
				id: "infant-cpr",
				description: "Proper technique for choking relief in toddlers",
				keyTopics: ["back blows", "chest thrusts", "positioning"],
			},
		],

		systemPrompt: `You are guiding someone through a critical choking emergency involving a toddler. Focus on:
- The extreme time pressure (every second counts)
- The emotional challenge of panicked parents
- Proper technique for small children
- Managing a public emergency

Use Socratic questioning to help them think quickly but accurately. This is life-or-death, so guide them efficiently while ensuring they understand the reasoning.`,

		initialPrompt: `You're having dinner with your family when you hear a commotion at the table next to you. A 2-year-old girl named Emma was eating when she suddenly stopped making any sound. Her parents are frantically patting her back, but she can't cough, cry, or make any noise. Her face is starting to turn red, and her eyes are wide with fear.

The parents are shouting "She's choking! Someone help!" The restaurant is busy and noisy, but a few people are starting to notice the emergency.

This is happening right now. What do you see that tells you this is serious? What's your immediate concern?`,

		guidingQuestions: [
			{
				topic: "severity-assessment",
				trigger: "initial observation",
				examples: [
					"What signs tell you this is a complete airway obstruction rather than just coughing?",
					"How can you tell the difference between someone who can still breathe and someone who cannot?",
				],
			},
			{
				topic: "technique-for-age",
				trigger: "deciding to help",
				examples: [
					"Given Emma's age and size, how would your technique differ from helping an adult?",
					"What's important about positioning when helping a small child who's choking?",
				],
			},
		],

		assessmentCriteria: [
			{
				skill: "Emergency Recognition",
				indicators: [
					"identifies silent choking",
					"recognizes urgency",
					"acts quickly",
				],
				responses: {
					strong: [
						"You immediately recognized the most dangerous type of choking - when they can't make any sound. That quick recognition is life-saving.",
					],
					developing: [
						"You can see something's wrong. What makes this more serious than just coughing or gagging?",
					],
					needs_support: [
						"This is a critical emergency. What signs tell you Emma's airway is completely blocked?",
					],
				},
			},
		],

		conversationStages: [
			{
				stage: "Recognition",
				description: "Identify the emergency and severity",
				objectives: ["Recognize complete obstruction", "Assess urgency"],
				transitionTriggers: ["identifies choking", "moves to help"],
			},
			{
				stage: "Intervention",
				description: "Provide appropriate choking relief",
				objectives: [
					"Position child correctly",
					"Perform back blows and chest thrusts",
				],
				transitionTriggers: ["starts back blows", "performs technique"],
			},
			{
				stage: "Follow-up",
				description: "Continue care and call for help",
				objectives: [
					"Continue until obstruction clears",
					"Ensure medical evaluation",
				],
				transitionTriggers: ["object clears", "discusses aftermath"],
			},
		],
	},
];

export const getScenarioById = (
	id: string,
): ConversationalScenario | undefined => {
	return conversationalScenarios.find((scenario) => scenario.id === id);
};

export const getScenariosByDifficulty = (
	difficulty: ConversationalScenario["difficulty"],
): ConversationalScenario[] => {
	return conversationalScenarios.filter(
		(scenario) => scenario.difficulty === difficulty,
	);
};
