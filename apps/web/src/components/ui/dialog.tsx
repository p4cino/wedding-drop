"use client";

import { Dialog, useDialogContext } from "@ark-ui/react/dialog";
import { ark } from "@ark-ui/react/factory";
import { type ComponentProps, forwardRef } from "react";
import { styled } from "styled-system/jsx";
import { type DialogVariantProps, dialog } from "styled-system/recipes";
import { createStyleContext } from "@/lib/create-style-context";

const { withRootProvider, withContext } = createStyleContext(dialog);

export type DialogRootProps = ComponentProps<typeof DialogRoot> &
	DialogVariantProps;
export const DialogRoot = withRootProvider(Dialog.Root, {
	defaultProps: { unmountOnExit: true, lazyMount: true },
});
export const DialogBackdrop = withContext(Dialog.Backdrop, "backdrop");
export const DialogPositioner = withContext(Dialog.Positioner, "positioner");
export const DialogContent = withContext(Dialog.Content, "content");
export const DialogTitle = withContext(Dialog.Title, "title");
export const DialogDescription = withContext(Dialog.Description, "description");
export const DialogCloseTrigger = withContext(
	Dialog.CloseTrigger,
	"closeTrigger",
);
export const DialogTrigger = withContext(Dialog.Trigger, "trigger");
export const DialogBody = styled(ark.div);
export const DialogHeader = styled(ark.div);
export const DialogFooter = styled(ark.div);

const StyledButton = styled(ark.button);

export const DialogActionTrigger = forwardRef<
	HTMLButtonElement,
	ComponentProps<typeof StyledButton>
>(function DialogActionTrigger(props, ref) {
	const ctx = useDialogContext();
	return (
		<StyledButton
			{...props}
			ref={ref}
			onClick={(e) => {
				props.onClick?.(e);
				ctx.setOpen(false);
			}}
		/>
	);
});

export const Modal = {
	Root: DialogRoot,
	Backdrop: DialogBackdrop,
	Positioner: DialogPositioner,
	Content: DialogContent,
	Title: DialogTitle,
	Description: DialogDescription,
	CloseTrigger: DialogCloseTrigger,
	Trigger: DialogTrigger,
	Body: DialogBody,
	Header: DialogHeader,
	Footer: DialogFooter,
	ActionTrigger: DialogActionTrigger,
};

export { DialogContext as Context } from "@ark-ui/react/dialog";
