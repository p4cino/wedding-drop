# Design

## Context

Aplikacja używa `next-intl` z `NextIntlClientProvider` w `[locale]/layout.tsx`; testy jednostkowe mockują `useTranslations` globalnie (`tests/setup.ts` zwraca klucz). Strona offline jest serwerowym komponentem pod `[locale]`, więc może użyć `getTranslations`.

## Goals / Non-Goals

**Goals:**
- Zero twardych tekstów w wymienionych plikach; automatyczna kontrola parzystości kluczy.

**Non-Goals:**
- Lokalizacja komunikatów błędów API.

## Decisions

- **Klucze współdzielone w `Common`** (`opensInNewTab`, `backToHome`, `footerTagline`), aby uniknąć powielania w namespace'ach `Admin`/`Legal`.
- **Interpolacja zamiast sklejania:** `slideAnnouncement` z parametrami `{current}`, `{total}`, `{name}`; `imageAria`/`videoAria` z `{name}`, spójnie z istniejącym `uploaderLabel`.
- **`generateMetadata`:** `getTranslations({ locale, namespace: "Meta" })` w layoucie i na stronie offline zamiast statycznego `metadata`; `robots`/`viewport` bez zmian (`noindex` musi zostać).
- **Test parzystości:** `tests/unit/messages-parity.test.ts` spłaszcza klucze trzech plików i porównuje zbiory; wynik pokazuje różnicę.
- **Testy komponentów** używają mocka zwracającego klucze, więc asercje sprawdzają klucze (np. `lightboxAria`), a nie treść.

## Risks / Trade-offs

- [Ryzyko: nakładanie się z `split-admin-page` w plikach `messages/*.json`] → Mitigacja: konflikty tylko tekstowe (dopisywane klucze); rozwiązanie mechaniczne.
- [Ryzyko: tłumaczenia DE/EN wykonane bez native review] → Mitigacja: krótkie, proste frazy; oznaczyć do przeglądu przez właściciela projektu.
