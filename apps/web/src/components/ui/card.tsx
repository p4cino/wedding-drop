"use client";

import { ark } from "@ark-ui/react/factory";
import type { ComponentProps } from "react";
import { type CardVariantProps, card } from "styled-system/recipes";
import { createStyleContext } from "@/lib/create-style-context";

const { withProvider, withContext } = createStyleContext(card);

export type CardRootProps = ComponentProps<typeof CardRoot> & CardVariantProps;
export const CardRoot = withProvider(ark.div, "root");
export const CardHeader = withContext(ark.div, "header");
export const CardBody = withContext(ark.div, "body");
export const CardFooter = withContext(ark.div, "footer");
export const CardTitle = withContext(ark.h3, "title");
export const CardDescription = withContext(ark.p, "description");

export const Card = {
	Root: CardRoot,
	Header: CardHeader,
	Body: CardBody,
	Footer: CardFooter,
	Title: CardTitle,
	Description: CardDescription,
};
