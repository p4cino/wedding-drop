"use client";

import { Dialog } from "@ark-ui/react/dialog";
import { ark } from "@ark-ui/react/factory";
import type { ComponentProps } from "react";
import { type DrawerVariantProps, drawer } from "styled-system/recipes";
import { createStyleContext } from "@/lib/create-style-context";

const { withRootProvider, withContext } = createStyleContext(drawer);

export type DrawerRootProps = ComponentProps<typeof DrawerRoot> &
	DrawerVariantProps;
export const DrawerRoot = withRootProvider(Dialog.Root, {
	defaultProps: { unmountOnExit: true, lazyMount: true },
});
export const DrawerBackdrop = withContext(Dialog.Backdrop, "backdrop");
export const DrawerPositioner = withContext(Dialog.Positioner, "positioner");
export const DrawerContent = withContext(Dialog.Content, "content");
export const DrawerTitle = withContext(Dialog.Title, "title");
export const DrawerDescription = withContext(Dialog.Description, "description");
export const DrawerCloseTrigger = withContext(
	Dialog.CloseTrigger,
	"closeTrigger",
);
export const DrawerTrigger = withContext(Dialog.Trigger, "trigger");
export const DrawerBody = withContext(ark.div, "body");
export const DrawerHeader = withContext(ark.div, "header");
export const DrawerFooter = withContext(ark.div, "footer");

export const Drawer = {
	Root: DrawerRoot,
	Backdrop: DrawerBackdrop,
	Positioner: DrawerPositioner,
	Content: DrawerContent,
	Title: DrawerTitle,
	Description: DrawerDescription,
	CloseTrigger: DrawerCloseTrigger,
	Trigger: DrawerTrigger,
	Body: DrawerBody,
	Header: DrawerHeader,
	Footer: DrawerFooter,
};

export { DialogContext as Context } from "@ark-ui/react/dialog";
