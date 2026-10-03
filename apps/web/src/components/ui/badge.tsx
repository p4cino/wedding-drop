import { ark } from "@ark-ui/react/factory";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";
import { type BadgeVariantProps, badge } from "styled-system/recipes";

export type BadgeProps = ComponentProps<typeof Badge> & BadgeVariantProps;
export const Badge = styled(ark.div, badge);
