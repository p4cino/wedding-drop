import { type ApiResult, authedRequest } from "@/lib/api-request";

export type OwnerApiResult<T = unknown> = ApiResult<T>;

/**
 * Jedyne miejsce dokładające token właściciela do żądań panelu (nagłówek
 * `x-owner-token`). Nie rzuca wyjątków — patrz `authedRequest`.
 */
export function ownerRequest<T = unknown>(
	token: string,
	method: string,
	url: string,
	body?: unknown,
): Promise<OwnerApiResult<T>> {
	return authedRequest<T>("x-owner-token", token, method, url, body);
}
