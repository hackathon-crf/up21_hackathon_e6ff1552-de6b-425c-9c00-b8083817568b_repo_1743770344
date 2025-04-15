"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/components/ui/chart";

// Define a proper type for the tooltip props
interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		dataKey?: string;
		name?: string;
		value?: number;
		fill?: string;
		stroke?: string;
	}>;
	label?: string;
	formatTimeValue?: (value: number) => string;
}

export function DashboardChart({ data }: { data: any[] }) {
	// Format time value to hh:mm:ss
	const formatTimeValue = (value: number): string => {
		// Assuming the value is in hours
		const hours = Math.floor(value);
		const minutes = Math.floor((value - hours) * 60);
		const seconds = Math.floor(((value - hours) * 60 - minutes) * 60);

		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	// Ensure data is valid and has the expected structure
	const chartData =
		Array.isArray(data) && data.length > 0
			? data.map((item) => ({
					name: item.day,
					"Cards Reviewed": item.cards,
					"Game Score": item.games,
					"Study Time": item.chat, // Keep the original value for the chart
				}))
			: [];

	// Define the chart configuration
	const chartConfig = {
		"Cards Reviewed": {
			label: "Cards Reviewed",
			color: "#e11d48",
		},
		"Game Score": {
			label: "Game Score",
			color: "#22d3ee",
		},
		"Study Time": {
			label: "Study Time",
			color: "#a855f7",
		},
	};

	return (
		<ChartContainer config={chartConfig}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis dataKey="name" />
					<YAxis />
					<Tooltip
						content={(props) => (
							<CustomTooltip {...props} formatTimeValue={formatTimeValue} />
						)}
					/>
					<Legend />
					<Bar dataKey="Cards Reviewed" fill="#e11d48" radius={[4, 4, 0, 0]} />
					<Bar dataKey="Game Score" fill="#22d3ee" radius={[4, 4, 0, 0]} />
					<Bar dataKey="Study Time" fill="#a855f7" radius={[4, 4, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}

// Improved CustomTooltip with proper type checking and error handling
function CustomTooltip({
	active,
	payload,
	label,
	formatTimeValue,
}: CustomTooltipProps) {
	// Comprehensive null/undefined checks
	if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
		return null;
	}

	return (
		<div className="min-w-[8rem] rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
			<div className="font-medium">{label || "Unknown"}</div>
			<div className="mt-1.5 space-y-1">
				{payload.map((item, index) => (
					<div
						key={item.dataKey || `item-${index}`}
						className="flex items-center gap-2"
					>
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: item.fill || "#888" }}
						/>
						<div className="text-muted-foreground">
							{item.dataKey || "Value"}:
						</div>
						<div className="font-medium font-mono tabular-nums">
							{item.dataKey === "Study Time" && typeof item.value === "number"
								? formatTimeValue?.(item.value)
								: typeof item.value === "number"
									? item.value.toLocaleString()
									: "N/A"}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
