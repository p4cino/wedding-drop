"use client";

import {
	type ComponentPropsWithoutRef,
	type ComponentType,
	createContext,
	type ElementType,
	forwardRef,
	useContext,
} from "react";
import { cx } from "styled-system/css";

type GenericRecipe = {
	(props?: Record<string, unknown>): Record<string, string>;
	splitVariantProps: (
		props: Record<string, unknown>,
	) => [Record<string, unknown>, Record<string, unknown>];
};

type NamedComponent = { displayName?: string; name?: string };

export function createStyleContext<R extends GenericRecipe>(recipe: R) {
	type SlotMap = ReturnType<R>;
	const StyleContext = createContext<SlotMap | null>(null);

	const withRootProvider = <T extends ElementType>(
		Component: T,
		options?: { defaultProps?: Record<string, unknown> },
	) => {
		const Comp = forwardRef<
			unknown,
			ComponentPropsWithoutRef<T> & Record<string, unknown>
		>((props, ref) => {
			const mergedProps = { ...options?.defaultProps, ...props };
			const [variantProps, restProps] = recipe.splitVariantProps(
				mergedProps as Record<string, unknown>,
			);
			const slotStyles = recipe(variantProps) as SlotMap;
			const combinedProps = {
				...(restProps as Record<string, unknown>),
				ref,
			};
			const Element = Component as ComponentType<Record<string, unknown>>;
			return (
				<StyleContext.Provider value={slotStyles}>
					<Element {...combinedProps} />
				</StyleContext.Provider>
			);
		});
		const compName =
			typeof Component === "string"
				? Component
				: (Component as unknown as NamedComponent).displayName ||
					(Component as unknown as NamedComponent).name ||
					"Component";
		Comp.displayName = `withRootProvider(${compName})`;
		return Comp;
	};

	const withProvider = <T extends ElementType>(
		Component: T,
		slot: keyof SlotMap,
	) => {
		const Comp = forwardRef<
			unknown,
			ComponentPropsWithoutRef<T> & Record<string, unknown>
		>((props, ref) => {
			const [variantProps, restProps] = recipe.splitVariantProps(
				props as Record<string, unknown>,
			);
			const slotStyles = recipe(variantProps) as SlotMap;
			const className = cx(
				slotStyles[slot as string],
				(restProps as Record<string, unknown>).className as string,
			);
			const combinedProps = {
				...(restProps as Record<string, unknown>),
				ref,
				className,
				"data-slot": slot,
			};
			const Element = Component as ComponentType<Record<string, unknown>>;
			return (
				<StyleContext.Provider value={slotStyles}>
					<Element {...combinedProps} />
				</StyleContext.Provider>
			);
		});
		const compName =
			typeof Component === "string"
				? Component
				: (Component as unknown as NamedComponent).displayName ||
					(Component as unknown as NamedComponent).name ||
					"Component";
		Comp.displayName = `withProvider(${compName})`;
		return Comp;
	};

	const withContext = <T extends ElementType>(
		Component: T,
		slot: keyof SlotMap,
	) => {
		const Comp = forwardRef<
			unknown,
			ComponentPropsWithoutRef<T> & Record<string, unknown>
		>((props, ref) => {
			const slotStyles = useContext(StyleContext);
			const className = cx(
				slotStyles?.[slot as string],
				(props as Record<string, unknown>).className as string,
			);
			const combinedProps = {
				...(props as Record<string, unknown>),
				ref,
				className,
				"data-slot": slot,
			};
			const Element = Component as ComponentType<Record<string, unknown>>;
			return <Element {...combinedProps} />;
		});
		const compName =
			typeof Component === "string"
				? Component
				: (Component as unknown as NamedComponent).displayName ||
					(Component as unknown as NamedComponent).name ||
					"Component";
		Comp.displayName = `withContext(${compName})`;
		return Comp;
	};

	return {
		withRootProvider,
		withProvider,
		withContext,
		useSlotStyles: () => useContext(StyleContext),
	};
}
