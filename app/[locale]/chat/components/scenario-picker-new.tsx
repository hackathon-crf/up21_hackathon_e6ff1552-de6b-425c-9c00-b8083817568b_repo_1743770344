"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	Baby,
	Bandage,
	BookOpen,
	Brain,
	FileText,
	Flame,
	Heart,
	Home,
	Lightbulb,
	Phone,
	Scissors,
	Shield,
	Users,
	Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

// Helper function to get localized scenario data
function useLocalizedScenarioTitle(scenarioId: string) {
	const t = useTranslations("scenarios.emergency");

	const titleMap: Record<string, string> = {
		"office-cardiac-arrest": t("officeCardiacArrest.title"),
		"restaurant-choking": t("restaurantChoking.title"),
		"hiking-bleeding": t("hikingBleeding.title"),
		"kitchen-burn": t("kitchenBurn.title"),
		"pool-drowning": t("poolDrowning.title"),
		"allergic-reaction": t("allergicReaction.title"),
		"workplace-seizure": t("workplaceSeizure.title"),
	};

	return titleMap[scenarioId];
}

function useLocalizedScenarioDescription(scenarioId: string) {
	const t = useTranslations("scenarios.emergency");

	const descriptionMap: Record<string, string> = {
		"office-cardiac-arrest": t("officeCardiacArrest.description"),
		"restaurant-choking": t("restaurantChoking.description"),
		"hiking-bleeding": t("hikingBleeding.description"),
		"kitchen-burn": t("kitchenBurn.description"),
		"pool-drowning": t("poolDrowning.description"),
		"allergic-reaction": t("allergicReaction.description"),
		"workplace-seizure": t("workplaceSeizure.description"),
	};

	return descriptionMap[scenarioId];
}

// Enhanced scenario data type for rich emergency experiences
export interface Scenario {
	id: string;
	title: string;
	description: string;
	icon: React.ElementType;

	// Rich emergency context
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

	// AI system prompt with full context
	systemPrompt: string;

	// Dynamic opening message that AI will deliver
	openingMessage: string;

	// Learning objectives for this scenario
	learningGoals: string[];
}

// Emergency scenarios (core 4) - Rich, immersive experiences
const emergencyScenarios: Scenario[] = [
	{
		id: "office-cardiac-arrest",
		title: "Office Cardiac Arrest",
		description: "Life-saving response when a coworker suddenly collapses",
		icon: Heart,
		situation: {
			location: "Corporate office conference room, 14th floor",
			timeOfDay: "2:30 PM, Tuesday afternoon",
			weather: "Clear day",
			people: [
				{
					name: "Sarah",
					age: 52,
					role: "Victim - Coworker",
					condition: "Unconscious, not breathing, no pulse",
				},
				{
					name: "Mike",
					age: 35,
					role: "Panicked coworker",
					condition: "Very stressed, wants to help",
				},
				{
					name: "Jennifer",
					age: 29,
					role: "Meeting attendee",
					condition: "Recording on phone, staying back",
				},
				{
					name: "David",
					age: 45,
					role: "Manager",
					condition: "Trying to maintain calm, coordinating",
				},
				{ name: "You", role: "First responder", condition: "Must take charge" },
			],
			environment:
				"Modern office building with security, elevators, possible AED on floor",
			urgency: "critical",
			availableResources: [
				"Conference phone for 911",
				"Possible AED in building",
				"Multiple people to help",
				"Office first aid kit",
			],
			constraints: [
				"No immediate medical professionals",
				"Elevator access for paramedics",
				"Workplace liability concerns",
				"Emotional coworkers",
			],
		},
		systemPrompt: `You are an emergency medical instructor conducting a realistic CPR training simulation. The user is experiencing a cardiac arrest emergency in their office.

SCENARIO CONTEXT: Sarah (52) has suddenly collapsed during a meeting. She's unconscious, not breathing, and has no pulse. The user must take charge of this emergency situation.

YOUR ROLE: Speak as multiple characters - Sarah (victim), Mike (panicked coworker), Jennifer (bystander), David (manager), and occasionally as the 911 dispatcher. Use realistic dialogue showing stress, confusion, and urgency.

GUIDANCE APPROACH:
- Present immediate decisions the user must make
- Show realistic human emotions and reactions from bystanders
- Guide through proper CPR technique if initiated
- Introduce complications realistically (AED availability, paramedic ETA, etc.)
- Provide immediate feedback on decisions
- Create time pressure and authentic emergency atmosphere

Start by immediately presenting the emergency situation with vivid, realistic details.`,
		openingMessage: `*URGENT EMERGENCY IN PROGRESS*

You're in the middle of a quarterly review meeting when Sarah, your 52-year-old marketing director, suddenly clutches her chest and collapses to the floor. Her face is turning gray-blue.

**Mike (frantically)**: "Oh my God! Sarah! SARAH! Someone call 911!"

**David (manager, trying to stay calm)**: "What happened? Is she breathing?"

**Jennifer (backing away, phone out)**: "Should I be recording this? What do I do?"

Sarah is completely unconscious on the conference room floor. You can't see her chest rising or falling. 

**What do you do first?** Time is critical - brain damage can occur within 4-6 minutes without oxygen.`,
		learningGoals: [
			"Assess responsiveness and breathing quickly",
			"Call 911 and coordinate help effectively",
			"Perform high-quality chest compressions",
			"Manage bystanders and delegate tasks",
			"Use AED if available",
			"Continue until paramedics arrive",
		],
	},
	{
		id: "restaurant-choking",
		title: "Restaurant Choking",
		description: "Emergency response when someone is choking in public",
		icon: AlertTriangle,
		situation: {
			location: "Busy Italian restaurant, dinner rush",
			timeOfDay: "7:45 PM, Saturday evening",
			weather: "Indoor setting",
			people: [
				{
					name: "Maria",
					age: 34,
					role: "Victim - Choking woman",
					condition: "Conscious, choking on food, turning blue",
				},
				{
					name: "Carlos",
					age: 36,
					role: "Husband",
					condition: "Panicking, doesn't know what to do",
				},
				{
					name: "Tommy",
					age: 22,
					role: "Waiter",
					condition: "Young, inexperienced, scared",
				},
				{
					name: "Other diners",
					role: "Restaurant customers",
					condition: "Watching, some filming",
				},
				{ name: "You", role: "Good Samaritan", condition: "Must act quickly" },
			],
			environment:
				"Crowded restaurant with narrow aisles, other diners watching",
			urgency: "critical",
			availableResources: [
				"Restaurant phone for 911",
				"Multiple witnesses",
				"Restaurant staff",
				"Water/ice available",
			],
			constraints: [
				"Public setting with onlookers",
				"Limited space between tables",
				"Legal liability concerns",
				"Time pressure",
			],
		},
		systemPrompt: `You are an emergency response instructor conducting a realistic choking emergency simulation. The user is witnessing a choking incident in a busy restaurant.

SCENARIO CONTEXT: Maria (34) is choking on food at a restaurant. She's conscious but can't speak, cough, or breathe. Her husband Carlos is panicking, and restaurant staff are inexperienced.

YOUR ROLE: Speak as Maria (choking victim - gestures/expressions only), Carlos (panicked husband), Tommy (nervous waiter), other diners, and potential 911 dispatcher. Show realistic human reactions.

GUIDANCE APPROACH:
- Present the universal choking sign and victim's distress clearly
- Show bystander confusion and panic realistically
- Guide through proper assessment (can they cough/speak?)
- Teach Heimlich maneuver technique if appropriate
- Handle complications (pregnant victim, size differences, failure of technique)
- Create urgency while maintaining educational value

Start with the immediate crisis requiring quick recognition and action.`,
		openingMessage: `*CHOKING EMERGENCY IN PROGRESS*

You're enjoying dinner at Luigi's when you notice a woman at the table next to you suddenly stand up, hands clutched to her throat. Her face is turning red, then blue.

**Carlos (husband, panicked)**: "Maria! MARIA! What's wrong?! Can you breathe?!"

**Tommy (young waiter, nervous)**: "Um, is everything okay? Should I... should I get the manager?"

**Maria**: *Makes universal choking sign - hands at throat, eyes wide with terror, unable to make sound, nodding frantically*

**Other diners**: *Starting to notice and stare, some pulling out phones*

**Carlos**: "She was eating the chicken parmigiana! She can't breathe! OH GOD, HELP HER!"

Maria is conscious but clearly in severe distress. She cannot speak, cough, or make any sound. Her lips are turning blue.

**What do you do immediately?** You have seconds to act before she loses consciousness.`,
		learningGoals: [
			"Recognize universal choking signs",
			"Assess if victim can cough or speak",
			"Perform Heimlich maneuver correctly",
			"Handle conscious vs unconscious choking",
			"Manage bystanders in public emergency",
			"Know when to call 911",
		],
	},
	{
		id: "hiking-bleeding",
		title: "Hiking Trail Injury",
		description: "Severe bleeding emergency in remote wilderness setting",
		icon: Bandage,
		situation: {
			location: "Rocky mountain trail, 3 miles from nearest road",
			timeOfDay: "4:30 PM, getting toward evening",
			weather: "Partly cloudy, temperature dropping, light breeze",
			people: [
				{
					name: "Jake",
					age: 28,
					role: "Injured hiker",
					condition: "Deep laceration on leg, heavy bleeding, going into shock",
				},
				{
					name: "Lisa",
					age: 26,
					role: "Jake's girlfriend",
					condition: "Very scared, wants to run for help",
				},
				{
					name: "Sam",
					age: 45,
					role: "Experienced hiker",
					condition: "Calm but concerned, knows area",
				},
				{
					name: "You",
					role: "Group member with first aid knowledge",
					condition: "Must manage emergency",
				},
			],
			environment:
				"Rocky trail, 3 miles from parking lot, no cell service, daylight fading",
			urgency: "high",
			availableResources: [
				"Basic first aid kit",
				"Extra clothing for warmth",
				"Water bottles",
				"Cell phones (no service)",
				"Hiking poles",
			],
			constraints: [
				"No cell service",
				"Remote location",
				"Limited medical supplies",
				"Approaching darkness",
				"Need to evacuate casualty",
			],
		},
		systemPrompt: `You are a wilderness first aid instructor conducting a realistic severe bleeding emergency simulation. The user is dealing with a serious injury in a remote location.

SCENARIO CONTEXT: Jake (28) has suffered a deep laceration on his leg from a sharp rock. He's bleeding heavily and starting to show signs of shock. The group is 3 miles from the trailhead with no cell service.

YOUR ROLE: Speak as Jake (injured, in pain, becoming confused), Lisa (scared girlfriend wanting to run for help), Sam (experienced hiker offering practical advice), and potential emergency services when reached.

GUIDANCE APPROACH:
- Show realistic injury severity and shock progression
- Present difficult decisions about evacuation vs treatment
- Guide through proper bleeding control techniques
- Address wilderness-specific challenges (limited supplies, weather, distance)
- Show realistic human emotions under stress
- Teach improvisation with available materials

Start with the immediate injury and blood loss requiring urgent intervention.`,
		openingMessage: `*SEVERE TRAUMA EMERGENCY*

You're hiking with friends when Jake suddenly slips on wet rocks near a cliff edge. You hear a sickening crack and his scream echoes through the canyon.

**Jake (in severe pain)**: "Oh God! Oh God! My leg! There's so much blood! I can't... I can't stop it!"

**Lisa (panicking)**: "JAKE! We need to get him out of here NOW! I'm running back to get help!"

**Sam (trying to stay calm)**: "Wait, Lisa! It's 3 miles back and getting dark. Look at all that blood - we need to stop the bleeding first."

You look down at Jake's leg - there's a deep, jagged cut about 6 inches long on his calf. Blood is flowing steadily, soaking through his hiking pants and pooling on the rocks. His face is getting pale.

**Jake (voice shaking)**: "I'm getting dizzy... is that normal? The blood won't stop..."

Your first aid kit has: gauze pads, ace bandage, antiseptic wipes, tape, scissors, and instant cold pack.

**What's your immediate priority?** Jake is losing blood fast and you're miles from help.`,
		learningGoals: [
			"Control severe bleeding with direct pressure",
			"Recognize and treat shock symptoms",
			"Make evacuation vs treatment decisions",
			"Improvise with limited wilderness resources",
			"Coordinate group response in emergency",
			"Handle psychological aspects of trauma",
		],
	},
	{
		id: "kitchen-burn",
		title: "Kitchen Burn Emergency",
		description: "Serious burn injury during family cooking accident",
		icon: Flame,
		situation: {
			location: "Family kitchen during Sunday dinner preparation",
			timeOfDay: "5:00 PM, Sunday evening",
			weather: "Indoor setting",
			people: [
				{
					name: "Emma",
					age: 16,
					role: "Teenager who got burned",
					condition: "2nd degree burn on forearm, in severe pain",
				},
				{
					name: "Mom (Karen)",
					age: 44,
					role: "Mother",
					condition: "Extremely upset, wants to put ice on burn",
				},
				{
					name: "Dad (Robert)",
					age: 47,
					role: "Father",
					condition: "Trying to take charge, considering emergency room",
				},
				{
					name: "Grandma (Helen)",
					age: 72,
					role: "Grandmother",
					condition: "Suggesting home remedies",
				},
				{
					name: "You",
					role: "Family friend with first aid training",
					condition: "Must provide proper care",
				},
			],
			environment:
				"Busy kitchen with hot stove, multiple family members, stressed atmosphere",
			urgency: "high",
			availableResources: [
				"Kitchen sink with cool water",
				"Clean towels",
				"First aid kit",
				"Phone for 911",
				"Car for hospital transport",
			],
			constraints: [
				"Conflicting advice from family",
				"Kitchen hazards still present",
				"Emotional family members",
				"Burn pain management",
			],
		},
		systemPrompt: `You are a burn care specialist conducting a realistic kitchen burn emergency simulation. The user is helping a teenager who suffered a serious burn injury.

SCENARIO CONTEXT: Emma (16) has suffered a 2nd degree burn on her forearm from hot oil while cooking. Family members are giving conflicting advice and emotions are high.

YOUR ROLE: Speak as Emma (in severe pain, scared), Karen (panicked mother with misconceptions), Robert (father trying to take control), Helen (grandmother with old remedies), and medical personnel if called.

GUIDANCE APPROACH:
- Show realistic burn injury pain and appearance
- Present common misconceptions about burn care (ice, butter, etc.)
- Guide through proper burn assessment and treatment
- Address family dynamics and conflicting advice
- Teach proper cooling, covering, and pain management
- Make decisions about medical care needs

Start with the immediate aftermath of the burn injury.`,
		openingMessage: `*BURN EMERGENCY IN KITCHEN*

You're helping prepare Sunday dinner when Emma screams and jumps back from the stove, clutching her right forearm. Hot oil has splashed across her skin.

**Emma (crying, in agony)**: "It burns! It burns so bad! Make it stop! Please make it stop!"

**Karen (Mom, frantically)**: "Oh my baby! Quick, get some ice! Ice will help! And butter! Grandma, where's the butter?"

**Helen (Grandma)**: "No, no! Cold water first, then aloe vera from my plant. That's what we always used."

**Robert (Dad, trying to be decisive)**: "Forget all that! We're going to the emergency room RIGHT NOW. Get in the car!"

**Emma**: "I don't want to go to the hospital! Just make it stop hurting!"

You can see Emma's forearm - the burn area is about 4 inches long and 2 inches wide. The skin is bright red with some blistering starting to form. She keeps trying to touch it.

**Karen**: "Should I put ice on it? What about that burn gel we have somewhere?"

**What do you do first?** The family is giving conflicting advice and Emma is in severe pain.`,
		learningGoals: [
			"Assess burn severity and size",
			"Provide proper immediate burn care",
			"Avoid common burn care mistakes",
			"Manage pain and prevent infection",
			"Make appropriate medical referral decisions",
			"Handle family crisis and emotions",
		],
	},
];

// All scenarios (including emergency + additional)
const allScenarios: Scenario[] = [
	// Emergency Scenarios
	...emergencyScenarios,

	// Additional Emergency Scenarios
	{
		id: "pool-drowning",
		title: "Pool Drowning Emergency",
		description: "Water rescue and resuscitation at family pool",
		icon: Users,
		situation: {
			location: "Backyard swimming pool at family barbecue",
			timeOfDay: "3:00 PM, sunny Saturday",
			weather: "Hot summer day, 85°F",
			people: [
				{
					name: "Tyler",
					age: 8,
					role: "Drowning child",
					condition: "Unconscious, pulled from pool, not breathing",
				},
				{
					name: "Susan",
					age: 35,
					role: "Tyler's mother",
					condition: "Hysterical, screaming",
				},
				{
					name: "Mark",
					age: 40,
					role: "Pool owner",
					condition: "Called 911, trying to help",
				},
				{
					name: "Guests",
					role: "Family barbecue attendees",
					condition: "Shocked, some recording",
				},
				{
					name: "You",
					role: "First responder",
					condition: "Must perform water rescue protocol",
				},
			],
			environment:
				"Backyard pool with deck, multiple witnesses, ambulance 8 minutes away",
			urgency: "critical",
			availableResources: [
				"Pool rescue equipment",
				"Phone for 911",
				"Multiple adults",
				"Poolside first aid kit",
			],
			constraints: [
				"Emotional family members",
				"Wet environment",
				"Time critical for brain damage",
				"Public setting",
			],
		},
		systemPrompt: `You are a water safety instructor conducting a realistic drowning emergency simulation. The user must handle a child drowning case.

SCENARIO CONTEXT: Tyler (8) was found unconscious at the bottom of the pool. He's been pulled out but isn't breathing. His mother is hysterical and time is critical.

YOUR ROLE: Speak as Tyler (unconscious victim), Susan (hysterical mother), Mark (trying to help), guests, and 911 dispatcher. Show realistic family trauma and urgency.

Start with the immediate need for rescue breathing and CPR in a drowning victim.`,
		openingMessage: `*CRITICAL DROWNING EMERGENCY*

Mark has just pulled 8-year-old Tyler from the bottom of the pool. The boy is unconscious, blue-tinged, and not breathing.

**Susan (screaming)**: "TYLER! TYLER! OH GOD, BREATHE! Please breathe, baby!"

**Mark (shouting)**: "I called 911! They're coming! What do we do? He's not breathing!"

**Guest**: "Someone needs to do CPR! Does anyone know CPR?"

Tyler is unconscious on the pool deck. His lips are blue, no chest movement, and he's been underwater for an unknown amount of time.

**What's your immediate priority?** Drowning victims require specific resuscitation techniques.`,
		learningGoals: [
			"Assess drowning victim safely",
			"Clear airway and check breathing",
			"Perform rescue breathing for drowning",
			"Adapt CPR for water emergencies",
			"Handle hysterical family members",
			"Continue care until EMS arrives",
		],
	},
	{
		id: "allergic-reaction",
		title: "Severe Allergic Reaction",
		description: "Anaphylaxis emergency at school cafeteria",
		icon: FileText,
		situation: {
			location: "High school cafeteria during lunch period",
			timeOfDay: "12:15 PM, Tuesday",
			weather: "Indoor setting",
			people: [
				{
					name: "Ashley",
					age: 16,
					role: "Student with allergy",
					condition: "Severe allergic reaction, difficulty breathing, hives",
				},
				{
					name: "School Nurse",
					age: 55,
					role: "Nurse",
					condition: "Not immediately available, in meeting",
				},
				{
					name: "Cafeteria Worker",
					age: 30,
					role: "Food service",
					condition: "Doesn't know about allergens in food",
				},
				{
					name: "Best Friend",
					age: 16,
					role: "Knows about allergy",
					condition: "Knows where EpiPen is",
				},
				{
					name: "You",
					role: "Teacher on lunch duty",
					condition: "Must respond to emergency",
				},
			],
			environment: "Crowded school cafeteria with hundreds of students",
			urgency: "critical",
			availableResources: [
				"Ashley's EpiPen in backpack",
				"School phone for 911",
				"Other teachers nearby",
			],
			constraints: [
				"Crowd of students",
				"Limited medical knowledge",
				"Time critical",
				"School protocol requirements",
			],
		},
		systemPrompt: `You are an allergy specialist conducting a realistic anaphylaxis emergency simulation. The user must handle a severe allergic reaction in a school setting.

SCENARIO CONTEXT: Ashley (16) is having a severe allergic reaction after eating lunch. She has hives, trouble breathing, and needs immediate intervention.

YOUR ROLE: Speak as Ashley (struggling to breathe, scared), her friend (knows about allergy), cafeteria worker (doesn't understand severity), and emergency services.

Guide through recognition of anaphylaxis and proper EpiPen administration.`,
		openingMessage: `*SEVERE ALLERGIC REACTION EMERGENCY*

Ashley suddenly stands up from her lunch table, gasping and clawing at her throat. Red hives are spreading across her face and neck.

**Ashley (struggling to speak)**: "Can't... breathe... something's wrong... throat closing..."

**Best Friend (panicked)**: "Oh no! Ashley's allergic to peanuts! Did someone put peanuts in the food?"

**Cafeteria Worker**: "We don't use peanuts in anything! It's just chicken nuggets!"

**Ashley**: *Face swelling, wheezing sounds, sitting down heavily*

**Best Friend**: "Her EpiPen! It's in her backpack! Someone help!"

Ashley's breathing is becoming more labored and her lips are starting to turn blue.

**What do you do immediately?** This is a life-threatening emergency requiring immediate action.`,
		learningGoals: [
			"Recognize anaphylaxis symptoms",
			"Locate and administer EpiPen",
			"Call emergency services quickly",
			"Position patient properly",
			"Monitor breathing and circulation",
			"Prepare for second dose if needed",
		],
	},
	{
		id: "workplace-seizure",
		title: "Workplace Seizure Emergency",
		description: "Coworker having seizure in office environment",
		icon: Zap,
		situation: {
			location: "Open office workspace with cubicles",
			timeOfDay: "2:45 PM, Wednesday afternoon",
			weather: "Indoor office setting",
			people: [
				{
					name: "Rebecca",
					age: 28,
					role: "Employee having seizure",
					condition: "Generalized tonic-clonic seizure",
				},
				{
					name: "Tom",
					age: 35,
					role: "Cubicle neighbor",
					condition: "Panicked, wants to restrain her",
				},
				{
					name: "Manager (Sarah)",
					age: 42,
					role: "Supervisor",
					condition: "Coordinating response, calling 911",
				},
				{
					name: "Coworkers",
					role: "Office employees",
					condition: "Gathering around, some recording",
				},
				{
					name: "You",
					role: "Employee with first aid training",
					condition: "Must manage seizure emergency",
				},
			],
			environment:
				"Office with hard floors, desks with sharp corners, many onlookers",
			urgency: "high",
			availableResources: [
				"Office first aid kit",
				"Soft items for padding",
				"Phone for 911",
				"Private office nearby",
			],
			constraints: [
				"Hard surfaces and obstacles",
				"Crowd of concerned coworkers",
				"Workplace policies",
				"Privacy concerns",
			],
		},
		systemPrompt: `You are a seizure specialist conducting a realistic seizure emergency simulation. The user must properly manage a coworker's seizure in an office environment.

SCENARIO CONTEXT: Rebecca (28) is having a generalized seizure at work. Coworkers are panicking and some want to restrain her, which is dangerous.

YOUR ROLE: Speak as Rebecca (during/after seizure), Tom (wanting to "help" incorrectly), Sarah (manager coordinating), and other concerned coworkers.

Guide through proper seizure first aid while correcting dangerous misconceptions.`,
		openingMessage: `*SEIZURE EMERGENCY IN OFFICE*

Rebecca suddenly collapses next to her desk and begins having a seizure. Her body is jerking violently and she's making unusual sounds.

**Tom (panicked)**: "Oh my God! Rebecca! Someone hold her down! She's going to hurt herself!"

**Manager Sarah**: "I'm calling 911! Should I put something in her mouth so she doesn't bite her tongue?"

**Coworker**: "Move these chairs away! She's going to hit her head on the desk!"

**Tom**: "How long has it been? Should we try to wake her up?"

Rebecca is on the floor having convulsions. Her limbs are jerking and there are hard surfaces and office furniture around her.

**What's your immediate priority?** Many people have dangerous misconceptions about seizure first aid.`,
		learningGoals: [
			"Ensure scene safety during seizure",
			"Time the seizure duration",
			"Protect from injury without restraining",
			"Clear common seizure myths",
			"Position for recovery phase",
			"Know when to call emergency services",
		],
	},
];

interface ScenarioPickerProps {
	onSelectScenario?: (scenario: Scenario) => void;
	onNewConversation?: () => void;
	onBrowseScenarios?: () => void;
	onClose?: () => void;
	isOverlay?: boolean;
	className?: string;
}

interface ScenarioCardProps {
	scenario: Scenario;
	onSelect: (scenario: Scenario) => void;
	isSelected?: boolean;
}

function ScenarioCard({ scenario, onSelect, isSelected }: ScenarioCardProps) {
	const Icon = scenario.icon;
	const localizedTitle =
		useLocalizedScenarioTitle(scenario.id) || scenario.title;
	const localizedDescription =
		useLocalizedScenarioDescription(scenario.id) || scenario.description;

	return (
		<button
			type="button"
			onClick={() => onSelect(scenario)}
			className={cn(
				"group flex h-20 w-full items-center rounded-2xl border bg-white p-3 transition-all duration-150 ease-out",
				"hover:border-red-600 hover:shadow-sm focus-visible:border-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/35",
				"active:translate-y-0.5 active:bg-red-50/60",
				isSelected ? "border-red-600 bg-red-50/60" : "border-gray-200",
			)}
			data-selected={isSelected}
			aria-pressed={isSelected}
		>
			{/* Icon container */}
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
				<Icon className="h-4 w-4 text-red-600" strokeWidth={2} />
			</div>

			{/* Text content */}
			<div className="ml-3 flex-1 text-left">
				<h3 className="font-semibold text-gray-800 text-sm leading-tight">
					{localizedTitle}
				</h3>
				<p className="mt-0.5 line-clamp-2 text-gray-600 text-xs leading-tight">
					{localizedDescription}
				</p>
			</div>
		</button>
	);
}

export function ScenarioPicker({
	onSelectScenario,
	onNewConversation,
	onBrowseScenarios,
	onClose,
	isOverlay = false,
	className,
}: ScenarioPickerProps) {
	const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
	const [showAllScenarios, setShowAllScenarios] = useState(false);
	const t = useTranslations("scenarios.picker");

	// Handle ESC key
	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === "Escape" && onClose) {
				onClose();
			}
		};

		if (isOverlay) {
			document.addEventListener("keydown", handleEsc);
			// Lock scroll when overlay is open
			document.body.style.overflow = "hidden";

			return () => {
				document.removeEventListener("keydown", handleEsc);
				document.body.style.overflow = "";
			};
		}

		return () => {
			document.removeEventListener("keydown", handleEsc);
		};
	}, [isOverlay, onClose]);

	const handleScenarioSelect = (scenario: Scenario) => {
		setSelectedScenario(scenario.id);
		onSelectScenario?.(scenario);
	};

	const handleBrowseAll = () => {
		setShowAllScenarios(true);
	};

	const handleBackToEmergency = () => {
		setShowAllScenarios(false);
	};

	const handleNewConversation = () => {
		onNewConversation?.();
	};

	// Click outside handler for overlay mode
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget && isOverlay && onClose) {
			onClose();
		}
	};

	const content = (
		<motion.div
			initial={{ opacity: 0, scale: 0.97 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.97 }}
			transition={{ duration: 0.16, ease: "easeOut" }}
			className={cn(
				"relative mx-auto w-full max-w-[660px] rounded-3xl border border-gray-200 bg-white p-12 pb-14 shadow-lg",
				className,
			)}
			role={isOverlay ? "dialog" : "region"}
			aria-modal={isOverlay}
			aria-labelledby="scenario-title"
			aria-describedby="scenario-description"
		>
			{/* Circular badge with light bulb */}
			<div className="mb-8 flex justify-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
					<Lightbulb className="h-6 w-6 text-red-600" strokeWidth={2} />
				</div>
			</div>

			{/* Title */}
			<h1
				id="scenario-title"
				className="mb-3 text-center font-semibold text-3xl text-gray-800 leading-9"
			>
				{showAllScenarios ? t("allScenariosTitle") : t("title")}
			</h1>

			{/* Subtitle */}
			<p
				id="scenario-description"
				className="mx-auto mb-8 max-w-[520px] text-center text-base text-gray-600 leading-6"
			>
				{showAllScenarios ? t("allScenariosSubtitle") : t("subtitle")}
			</p>

			{/* Scenario grid - responsive */}
			<div
				className={cn(
					"mb-8 grid gap-6",
					showAllScenarios
						? "max-h-[400px] grid-cols-1 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3"
						: "grid-cols-2",
				)}
			>
				{(showAllScenarios ? allScenarios : emergencyScenarios).map(
					(scenario) => (
						<ScenarioCard
							key={scenario.id}
							scenario={scenario}
							onSelect={handleScenarioSelect}
							isSelected={selectedScenario === scenario.id}
						/>
					),
				)}
			</div>

			{/* Action buttons */}
			{!showAllScenarios ? (
				<Button
					onClick={handleBrowseAll}
					className={cn(
						"mb-0 h-14 w-full rounded-xl font-semibold text-base",
						"bg-red-600 text-white",
						"hover:bg-red-700 active:bg-red-800",
						"focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/35",
					)}
				>
					<Zap className="mr-2 h-5 w-5" />
					{t("browseAllScenarios")}
				</Button>
			) : (
				<Button
					onClick={handleBackToEmergency}
					variant="outline"
					className={cn(
						"mb-0 h-14 w-full rounded-xl font-semibold text-base",
						"border-gray-300 bg-white text-gray-700",
						"hover:border-gray-400 hover:bg-gray-50",
						"focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-400/20",
					)}
				>
					{t("backToEmergencyScenarios")}
				</Button>
			)}
		</motion.div>
	);

	if (isOverlay) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.12, ease: "easeIn" }}
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
				onClick={handleBackdropClick}
			>
				{content}
			</motion.div>
		);
	}

	// Standalone mode (for entry experience)
	return (
		<div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center bg-gray-50 p-4">
			{content}

			{/* Secondary action - only in standalone mode */}
			<div className="mt-9 text-center">
				<p className="mb-4 text-gray-500 text-sm">
					{t("newConversationSubtitle")}
				</p>
				<Button
					onClick={handleNewConversation}
					variant="outline"
					className={cn(
						"h-12 rounded-xl border-gray-300 bg-white px-6 font-medium text-[15px] text-gray-700",
						"hover:border-gray-400 hover:bg-gray-50",
						"focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-400/20",
						"active:translate-y-0.5",
					)}
				>
					<BookOpen className="mr-2 h-4.5 w-4.5" />
					{t("newConversation")}
				</Button>
			</div>
		</div>
	);
}
