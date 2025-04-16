"use client";

import { useEffect, useRef } from "react";
import { DEBUG_MODE, debugColors } from "./utils";

// Component render tracker
export function useDebugRenders(
	componentName: string,
	color: string,
	props?: unknown,
) {
	const renderCount = useRef(0);

	if (DEBUG_MODE) {
		renderCount.current += 1;
		console.log(`%c[${componentName}] RENDER #${renderCount.current}`, color);

		if (props) {
			console.log(`%c[${componentName}] Props:`, color, props);
		}
	}

	return renderCount.current;
}

// State change tracker
export function useDebugState<T>(
	value: T,
	name: string,
	componentName: string,
	color: string,
) {
	const prevValue = useRef<T>(value);

	useEffect(() => {
		if (
			DEBUG_MODE &&
			JSON.stringify(prevValue.current) !== JSON.stringify(value)
		) {
			console.log(
				`%c[${componentName}] State "${name}" changed:`,
				color,
				"Previous:",
				prevValue.current,
				"New:",
				value,
			);
			prevValue.current = value;
		}
	}, [value, name, componentName, color]);
}

// Effect tracker
export function useDebugEffect(
	effectName: string,
	componentName: string,
	color: string,
	deps?: unknown[],
) {
	useEffect(() => {
		if (DEBUG_MODE) {
			console.log(`%c[${componentName}] Effect "${effectName}" ran`, color);

			if (deps) {
				console.log(
					`%c[${componentName}] Effect "${effectName}" dependencies:`,
					color,
					deps,
				);
			}
		}

		return () => {
			if (DEBUG_MODE) {
				console.log(
					`%c[${componentName}] Effect "${effectName}" cleanup`,
					color,
				);
			}
		};
	}, [color, componentName, effectName, deps, ...(deps || [])]);
}

// Callback tracker
export function useDebugCallback(
	callbackName: string,
	componentName: string,
	color: string,
) {
	return (...args: unknown[]) => {
		if (DEBUG_MODE) {
			console.log(
				`%c[${componentName}] Callback "${callbackName}" fired with args:`,
				color,
				args,
			);
		}
	};
}
