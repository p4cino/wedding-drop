import { ark } from "@ark-ui/react/factory";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";
import { type InputVariantProps, input } from "styled-system/recipes";

export type InputProps = ComponentProps<typeof Input> & InputVariantProps;
export const Input = styled(ark.input, input);
