"use client";

import { useCallback, useRef } from "react";
import { type ApiResult, authedRequest } from "@/lib/api-request";

/**
 * Żądania panelu administratora z nagłówkiem `x-admin-token`. Odpowiedź 401
 * (wygasły token) wywołuje `onUnauthorized`, żeby panel wrócił do logowania
 * zamiast pokazywać pustą listę.
 */
export function useAdminApi(token: string | null, onUnauthorized: () => void) {
	const onUnauthorizedRef = useRef(onUnauthorized);
	onUnauthorizedRef.current = onUnauthorized;

	return useCallback(
		async <T = unknown>(
			method: string,
			url: string,
			body?: unknown,
		): Promise<ApiResult<T>> => {
			const result = await authedRequest<T>(
				"x-admin-token",
				token ?? "",
				method,
				url,
				body,
			);
			if (result.status === 401) onUnauthorizedRef.current();
			return result;
		},
		[token],
	);
}
