"use client";

import {
	Toaster as ArkToaster,
	createToaster,
	Toast,
} from "@ark-ui/react/toast";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { styled } from "styled-system/jsx";
import { toast } from "styled-system/recipes";
import { createStyleContext } from "@/lib/create-style-context";

const { withProvider, withContext } = createStyleContext(toast);

export const ToastRoot = withProvider(Toast.Root, "root");
export const ToastTitle = withContext(Toast.Title, "title");
export const ToastDescription = withContext(Toast.Description, "description");
export const ToastActionTrigger = withContext(
	Toast.ActionTrigger,
	"actionTrigger",
);
export const ToastCloseTrigger = withContext(
	Toast.CloseTrigger,
	"closeTrigger",
);

export const toaster = createToaster({
	placement: "bottom-end",
	pauseOnPageIdle: true,
	overlap: true,
	max: 5,
});

const StyledArkToaster = styled(ArkToaster);

export const Toaster = () => {
	return (
		<StyledArkToaster toaster={toaster}>
			{(t) => (
				<ToastRoot>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
						}}
					>
						{t.type === "success" && <CheckCircle2 size={18} color="#15803d" />}
						{t.type === "error" && <AlertCircle size={18} color="#b91c1c" />}
						{t.type === "info" && <Info size={18} color="#0284c7" />}
						<div>
							{t.title && <ToastTitle>{t.title}</ToastTitle>}
							{t.description && (
								<ToastDescription>{t.description}</ToastDescription>
							)}
						</div>
					</div>
					<ToastCloseTrigger asChild>
						<button type="button" aria-label="Zamknij powiadomienie">
							<X size={16} />
						</button>
					</ToastCloseTrigger>
				</ToastRoot>
			)}
		</StyledArkToaster>
	);
};
