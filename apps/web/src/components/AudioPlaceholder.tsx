import { Mic } from "lucide-react";
import { css } from "styled-system/css";

/** Zastępuje miniaturę dla nagrań audio (nie mają obrazu). */
export default function AudioPlaceholder() {
	return (
		<div
			aria-hidden="true"
			className={css({
				w: "full",
				h: "full",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #1e293b, #475569)",
				color: "amber.300",
			})}
		>
			<Mic className={css({ w: "1/3", h: "1/3" })} />
		</div>
	);
}
