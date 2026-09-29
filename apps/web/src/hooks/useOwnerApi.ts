"use client";

import { useCallback } from "react";
import { type OwnerApiResult, ownerRequest } from "@/lib/owner-api";

/** Żądania panelu właściciela z automatycznie dołączanym tokenem. */
export function useOwnerApi(ownerToken: string) {
	return useCallback(
		<T = unknown>(
			method: string,
			url: string,
			body?: unknown,
		): Promise<OwnerApiResult<T>> =>
			ownerRequest<T>(ownerToken, method, url, body),
		[ownerToken],
	);
}
