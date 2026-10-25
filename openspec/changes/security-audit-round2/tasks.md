# Tasks

## 1. Współdzielony stan autoryzacji, sesje i synchronizacja hasła admina (F-02, F-09, F-10, F-11)

- [x] 1.1 Przenieść `runtimeFallbackSecret` oraz `revokedJtis` w `apps/web/src/lib/auth.ts` do singletonu w `globalThis`, dodać deterministyczną derywację sekretu zapasowego oraz sanityzację nazw ciasteczek w wyrażeniach regularnych, i zweryfikować testami w `apps/web/tests/unit/auth.test.ts`
- [x] 1.2 Powiązać `generateGuestToken` i `verifyGuestToken` ze skrótem aktualnego `guestPassword` galerii (z zachowaniem kompatybilności wstecznej), zaktualizować trasy galerii oraz dodać możliwość wyczyszczenia `guestPassword` w `apps/web/src/components/owner/ModerationSettingsPanel.tsx`
- [x] 1.3 W `GET /api/owner/[slug]/session` unieważniać dotychczasowy token właściciela przed wydaniem nowego podczas rotacji sesji i zweryfikować w `apps/web/tests/integration/api/security-hardening.test.ts`
- [x] 1.4 W `packages/db/src/client.ts` (`initDatabase`) aktualizować skrót hasła administratora w tabeli `admins`, gdy podano jawnie `process.env.ADMIN_PASSWORD` różniące się od zapisanego skrótu, i zweryfikować testami jednostkowymi `packages/db`

## 2. Izolacja Rate Limitera i ochrona nagłówków proxy (F-05)

- [x] 2.1 W `apps/web/src/lib/rate-limit.ts` odizolować kubełki uwierzytelniania (`admin-login`, `owner-login`, `owner-password`, `guest-login`, `zip-pin`) od kubełków publicznych, a w `authorizeHiddenAccess` (`apps/web/src/lib/auth.ts`) resetować licznik `owner-password` po poprawnym haśle
- [x] 2.2 Dodatkowe testy jednostkowe w `apps/web/tests/unit/rate-limit.test.ts` weryfikujące odporność kubełków autoryzacji na wyparcie FIFO przez ruch publiczny

## 3. Wzmocnienie `/media-file/*`, ZIP, SSE i prywatności galerii (F-01, F-03, F-04, F-14, F-15)

- [x] 3.1 W `apps/web/src/lib/media-file-handler.ts` wymusić prefiks `galleries/`, politykę fail-closed (`404` gdy brak rekordu w `media_items`), weryfikację `allowGuestViewing` i `isActive`, usunięcie `.svg` z mapy MIME, nagłówek `Content-Security-Policy: default-src 'none'; sandbox` oraz `Cache-Control: private, no-store` dla niepublicznych mediów, a w `apps/web/src/app/sw.ts` wykluczyć `/media-file/` z cache'owania
- [x] 3.2 W `apps/web/src/app/api/gallery/[slug]/zip/route.ts` wymusić blokadę `403 Forbidden` dla gości, gdy `gallery.allowGuestViewing === false`
- [x] 3.3 W `apps/web/src/app/api/gallery/[slug]/live/route.ts` zablokować emisję zdarzeń SSE `new-media` dla plików ze statusem innym niż `ready` do nieautoryzowanych gości, a w `apps/web/src/app/api/owner/[slug]/approval/route.ts` emitować `sseBus.notifyNewMedia` po zatwierdzeniu pliku (`action === "approve"`)
- [x] 3.4 Rozbudować testy w `apps/web/tests/unit/media-file-handler.test.ts` oraz `apps/web/tests/integration/api/security-hardening.test.ts` o scenariusze fail-closed (`tus_temp`), `allowGuestViewing: false` oraz prywatność SSE dla `pending`

## 4. Bezpieczeństwo TUS, kwot dyskowych i walidacji MIME (F-01, F-06, F-08, F-13)

- [x] 4.1 W `packages/media/src/tus-server.ts` zastąpić `Math.random()` przez `crypto.randomBytes(12).toString("hex")`, usuwać `ownerToken` ze zwracanych metadanych w `onUploadCreate` oraz śledzić bajty przesyłań w locie (`inFlightBytes`) przy sprawdzaniu `maxStorageBytes`
- [x] 4.2 W `packages/media/src/media-processor.ts` usuwać pliki metadanych TUS (`.json` / `.info`), ponownie weryfikować limit pojemności galerii przed zapisem do bazy oraz wyznaczać kanoniczny `mimeType` na podstawie zweryfikowanego rozszerzenia magic bytes
- [x] 4.3 Zaktualizować i rozszerzyć testy w `packages/media/tests/tus-server.test.ts` oraz `packages/media/tests/media-processor.test.ts`

## 5. Jednorazowość OAuth `state` oraz walidacja kart PDF/DTO (F-07, F-12)

- [x] 5.1 W `packages/media/src/google-drive.ts` wdrożyć jednorazową weryfikację `nonce` w `verifySignedState` (z pamięcią w `globalThis` i TTL), a w `apps/web/src/app/api/auth/google/route.ts` i `callback/route.ts` dodać ciasteczko wiążące `wd_gdrive_oauth_state` oraz sanityzację komunikatów błędów
- [x] 5.2 W `apps/web/src/app/api/owner/[slug]/card/route.ts` oraz `apps/web/src/app/api/gallery/[slug]/card/pdf/route.ts` wymusić walidację `updateCardSettingsDto`, a w `packages/media/src/pdf-card.ts` zabezpieczyć `sanitizeForPdf` (filtrowanie znaków spoza WinAnsi) i `hexToRgb` przed nieprawidłowymi danymi
- [x] 5.3 Rozbudować testy w `packages/media/tests/google-drive.test.ts`, `packages/media/tests/pdf-card.test.ts` oraz `apps/web/tests/integration/api/google-auth.test.ts`

## 6. Hardening infrastruktury Docker, Caddy, nagłówków i skryptów (F-16) i dokumentacja

- [x] 6.1 W `Caddyfile` dodać `header_up X-Forwarded-For {remote_host}`, `Strict-Transport-Security` i `Permissions-Policy`; w `apps/web/next.config.mjs` dodać nagłówki bezpieczeństwa; w `docker-compose.yml`, `docker-compose.prod.yml` i `.env.example` uzupełnić `ADMIN_SECRET`, `cap_add: [CHOWN, SETUID, SETGID]` i usunąć zbędny wolumen `app_data` z `caddy`; w `.agents/scripts/ops-helper.ts` walidować nazwę serwisu i użyć `execFileSync`
- [x] 6.2 Zaktualizować `README.md` oraz `DOCUMENTATION.md` o opis mechanizmów bezpieczeństwa i zmiennej `ADMIN_SECRET`, a następnie zweryfikować całość przez `pnpm biome check apps/ packages/`, `pnpm check-types`, `pnpm test` oraz `pnpm openspec validate security-audit-round2`
