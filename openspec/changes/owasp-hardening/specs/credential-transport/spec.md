# Spec Delta

## ADDED Requirements

### Requirement: Życzenia ignorują poświadczenia z query
`GET /api/gallery/{slug}/wishes` MUST ignorować parametry query `ownerToken`, `password` i `adminToken`; żądanie z samym takim parametrem SHALL być traktowane jak nieuwierzytelnione.

#### Scenario: Token właściciela w query dla ukrytych życzeń
- **WHEN** klient wysyła `GET /api/gallery/{slug}/wishes?includeHidden=true&ownerToken={ważny}` bez nagłówków
- **THEN** odpowiedź ma status 401

#### Scenario: Hasło w query dla ukrytych życzeń
- **WHEN** klient wysyła `GET /api/gallery/{slug}/wishes?includeHidden=true&password={poprawne}` bez nagłówków
- **THEN** odpowiedź ma status 401
