import type React from "react";
import { css, cx } from "styled-system/css";

interface EmptyStateProps {
	icon: React.ReactNode;
	title: string;
	hint: string;
	/** Pionowy odstęp wewnętrzny (galeria: `py-20`, księga życzeń: `py-16`). */
	className?: string;
}

/** Pusty stan listy (brak zdjęć / brak życzeń). */
export default function EmptyState({
	icon,
	title,
	hint,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cx(
				css({
					textAlign: "center",
					px: "4",
					py: "16",
					bg: "rgba(255, 255, 255, 0.6)",
					backdropFilter: "blur(4px)",
					borderRadius: "3xl",
					borderWidth: "1px",
					borderStyle: "dashed",
					borderColor: "slate.300",
				}),
				className,
			)}
		>
			<div
				className={css({
					w: "16",
					h: "16",
					mx: "auto",
					mb: "4",
					borderRadius: "full",
					bg: "amber.50",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "wedding.gold",
				})}
			>
				{icon}
			</div>
			<h4
				className={css({
					fontFamily: "serif",
					fontSize: "xl",
					fontWeight: "bold",
					color: "wedding.slate",
				})}
			>
				{title}
			</h4>
			<p
				className={css({
					fontSize: "sm",
					color: "slate.500",
					maxW: "sm",
					mx: "auto",
					mt: "1.5",
				})}
			>
				{hint}
			</p>
		</div>
	);
}
