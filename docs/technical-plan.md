# Plan techniczny aplikacji dla ośrodka jeździeckiego

**Status:** gotowy do rozpoczęcia implementacji  
**Data:** 12 lipca 2026  
**Cel:** zbudowanie MVP testowanego w realnym ośrodku, z architekturą gotową do rozwoju jako SaaS.

## 1. Decyzje techniczne

| Obszar                      | Ustalenie                                              |
| --------------------------- | ------------------------------------------------------ |
| Architektura kodu           | Monorepo                                               |
| Panel administracyjny       | Next.js + TypeScript                                   |
| Aplikacja mobilna           | React Native + Expo + TypeScript                       |
| Backend, baza i auth        | Supabase + PostgreSQL                                  |
| Hosting panelu              | Vercel                                                 |
| Region danych               | Unia Europejska, preferowany Frankfurt                 |
| Środowiska                  | Development i production                               |
| Kod źródłowy                | Prywatne repozytorium GitHub                           |
| Kalendarz                   | Własna implementacja na darmowych komponentach         |
| Dokładność czasu            | 15 minut                                               |
| Strefa czasowa MVP          | `Europe/Warsaw`                                        |
| Dystrybucja pilotażu mobile | Expo Go na iOS i Androidzie                            |
| Email                       | Resend, darmowy plan                                   |
| Monitoring błędów           | Sentry, darmowy plan                                   |
| Analityka użycia            | Prywatna analityka zdarzeń bez treści danych osobowych |
| Tryb offline                | Brak w MVP; aplikacja wymaga połączenia                |
| Załączniki                  | Brak w MVP                                             |

## 2. Architektura

```text
                     ┌─────────────────────┐
                     │  Next.js Web Admin  │
                     │       Vercel        │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     │                     │
          ┌──────────▼─────────┐ ┌─────────▼──────────┐
          │ React Native + Expo │ │  Supabase          │
          │  iOS / Android      │ │  Auth / API / DB   │
          └─────────────────────┘ └─────────┬──────────┘
                                             │
                           ┌─────────────────┼─────────────────┐
                           │                 │                 │
                 ┌─────────▼──────┐ ┌────────▼───────┐ ┌──────▼───────┐
                 │ PostgreSQL     │ │ Edge Functions │ │ Scheduled Jobs│
                 │ EU region      │ │ API workflows  │ │ reminders     │
                 └────────────────┘ └────────────────┘ └──────────────┘
```

Supabase jest właściwym wyborem dla MVP, ponieważ na darmowym planie dostarcza PostgreSQL, uwierzytelnianie, autoryzację na poziomie rekordów i mechanizmy serwerowe. Własny backend nie jest potrzebny na początku. Reguły biznesowe wymagające zaufanego wykonania będą działać w bazie lub w Supabase Edge Functions.

## 3. Struktura monorepo

```text
equestrian-scheduler/
├── apps/
│   ├── web/                 # Panel managera i instruktorów: Next.js
│   └── mobile/              # React Native / Expo
├── packages/
│   ├── domain/              # Typy domenowe, statusy, walidacja
│   ├── calendar/            # Wspólne reguły kalendarza i kolizji
│   ├── ui-tokens/           # Kolory, typografia, podstawowe tokeny UI
│   └── config/              # Wspólne konfiguracje TypeScript, ESLint
├── supabase/
│   ├── migrations/          # Migracje PostgreSQL
│   ├── functions/           # Edge Functions
│   └── seed.sql             # Dane testowe
├── docs/
│   ├── product-mvp.md
│   └── technical-plan.md
└── .github/workflows/       # Kontrola jakości i wdrożenia
```

Monorepo pozwala współdzielić typy, reguły walidacji i model domenowy między panelem webowym a aplikacją mobilną. Nie należy współdzielić całych komponentów interfejsu między Next.js i React Native, bo ich potrzeby wizualne będą różne.

## 4. Konta, role i dostęp

### Rejestracja

1. Administrator produktu tworzy pierwszy ośrodek.
2. Manager ośrodka wysyła zaproszenie na wymagany adres email.
3. Zaproszenie działa przez 7 dni.
4. Odbiorca otwiera link, ustawia hasło i aktywuje konto.
5. Użytkownik może sam zresetować hasło przez email.

### Role

- `manager` — pełne zarządzanie ośrodkiem, planem, zasobami, użytkownikami i prośbami;
- `instructor` — własne lekcje, przypisanie konia, status płatności, odwołanie własnych lekcji;
- `client` — własne jazdy, wolne terminy, prośby i zgłoszenie nieobecności;
- `boarder` — własne jazdy i anonimowe obłożenie zasobów;
- `product_admin` — wewnętrzna rola do tworzenia nowych ośrodków podczas fazy pilotażu.

Jedno konto użytkownika może należeć do wielu ośrodków i przełączać aktywną organizację. Jest to istotne dla instruktorów pracujących w więcej niż jednej stajni.

### Izolacja SaaS

Każdy rekord domenowy zawiera `organization_id`. Dostęp do danych musi być wymuszany przez Supabase Row Level Security, a nie tylko przez ukrywanie elementów interfejsu.

Przykładowa zasada: instruktor nie może odczytać lekcji innego ośrodka nawet wtedy, gdy ręcznie wywoła endpoint lub zmodyfikuje żądanie z przeglądarki.

## 5. Model danych

### Główne tabele

- `organizations` — nazwa, logo, strefa czasowa, ustawienia;
- `profiles` — imię, nazwisko, email, telefon;
- `memberships` — relacja użytkownika z ośrodkiem i rola;
- `invites` — token, rola, ośrodek, data wygaśnięcia i status użycia;
- `facility_resources` — hala, ujeżdżalnia, pojemność równoległych zajęć;
- `horses` — koń, status aktywności, dzienny limit jazd;
- `lesson_series` — szablon stałej lekcji tygodniowej;
- `lessons` — konkretne wydarzenie w kalendarzu;
- `lesson_participants` — osoba na lekcji, jej status i płatność;
- `participant_horses` — koń przypisany do konkretnego uczestnika;
- `booking_requests` — prośby o termin i ich decyzje;
- `audit_events` — historia zmian;
- `notifications` — stan powiadomień w aplikacji i push.

### Lekcje

Lekcja ma:

- czas początku i końca, z rozdzielczością 15 minut;
- zasób, np. hala albo ujeżdżalnia;
- instruktora;
- status: aktywna lub odwołana;
- listę uczestników;
- opcjonalną serię, jeśli powtarza się co tydzień.

Lekcja grupowa to **jeden wpis kalendarza z wieloma uczestnikami**. Koń jest przypisywany indywidualnie do uczestnika.

### Serie i wyjątki

Stały plan nie tworzy niezmienialnych kopii bez historii. Seria przechowuje regułę powtarzania, a pojedyncza zmiana tworzy wyjątek dotyczący danego dnia. Interfejs powinien umożliwić później wybór:

- zmień tylko tę lekcję;
- zmień wszystkie przyszłe lekcje serii.

W MVP domyślnym zachowaniem jest zmiana pojedynczego terminu jako wyjątku.

## 6. Reguły kalendarza

### Widoki

- dzień i tydzień;
- filtrowanie po zasobie, instruktorze oraz koniu;
- osobne widoki zależne od roli użytkownika;
- przeciąganie lekcji i zmiana długości w panelu webowym;
- tworzenie lekcji przez formularz.

### Pojemność zasobu

Każdy zasób ma ustawioną maksymalną liczbę równoległych zajęć lub osób. Nie zakładamy, że hala zawsze jest zasobem wyłącznym.

Podczas tworzenia i przesuwania lekcji system sprawdza:

- limit zasobu;
- dostępność instruktora;
- dostępność każdego przypisanego konia;
- limit uczestników lekcji grupowej;
- obciążenie konia.

W MVP konflikty powinny być najpierw wyraźnym ostrzeżeniem z możliwością potwierdzenia przez managera lub instruktora. Pełne blokowanie można dodać jako ustawienie ośrodka.

### Obciążenie konia

Koń ma konfigurowalny dzienny limit jazd. Przy przypisaniu instruktor widzi procent wykorzystania, np. `3/4 jazd — 75%`.

Odwołane lekcje oraz odwołany udział konkretnego uczestnika nie są wliczane do obciążenia.

### Odwołania

Odwołane wpisy nigdy nie są ukrywane z historii:

- pozostają w kalendarzu jako przekreślone;
- zachowują pierwotny termin i zasoby;
- zapisują osobę odwołującą, czas i opcjonalny powód;
- nie zajmują pojemności zasobu;
- nie zwiększają obciążenia konia;
- nie są liczone w anonimowym obłożeniu hali.

W grupie klient odwołuje wyłącznie własny udział. Manager albo instruktor odwołuje całą lekcję.

## 7. Powiadomienia

### Kanały MVP

- push w aplikacji Expo;
- email przy zaproszeniu, aktywacji konta i resecie hasła;
- centrum powiadomień w aplikacji, jeśli jest potrzebne do historii.

### Zdarzenia

- przypomnienie o jeździe 24 godziny przed terminem;
- zmiana lub odwołanie lekcji;
- decyzja managera o prośbie klienta;
- nowa prośba o termin dla managera.

Użytkownik może niezależnie włączyć lub wyłączyć kategorie: przypomnienia oraz zmiany planu. Komunikaty bezpieczeństwa konta nie powinny podlegać tej preferencji.

Przypomnienia realizują zaplanowane zadania po stronie serwera. Nie wolno opierać ich wyłącznie na telefonie użytkownika, bo aplikacja może być zamknięta lub urządzenie może nie mieć połączenia.

## 8. Prywatność i RODO

### Dane MVP

Gromadzimy wyłącznie:

- imię i nazwisko;
- email;
- numer telefonu;
- dane organizacyjne lekcji i płatności w prostym statusie.

Nie zbieramy danych medycznych, dat urodzenia, dokumentów ani załączników.

### Minimalne wymagania RODO

- polityka prywatności dostępna podczas aktywacji konta;
- opis administratora danych dla konkretnego ośrodka;
- możliwość eksportu danych użytkownika na żądanie;
- obsługa usunięcia danych na żądanie;
- archiwizacja kont i zasobów zamiast zwykłego kasowania rekordów;
- umowy powierzenia danych i konfiguracja dostawców w regionie UE przed publicznym wdrożeniem.

Historia lekcji, odwołań, płatności i dostępu jest przechowywana bezterminowo, dopóki obowiązki prawne lub żądanie usunięcia danych nie wymagają innego działania.

## 9. Historia zmian

Audit log musi obejmować:

- utworzenie, zmianę i odwołanie lekcji;
- zmianę terminu, zasobu, instruktora i konia;
- status płatności;
- utworzenie, zmianę roli i archiwizację użytkownika;
- wysłanie, użycie lub wygaśnięcie zaproszenia.

Wpis historii zawiera przynajmniej: organizację, osobę wykonującą akcję, typ akcji, czas, identyfikator obiektu oraz poprzednią i nową wartość w zakresie koniecznym do wyjaśnienia zmiany.

## 10. Jakość, monitoring i wdrożenia

### Kontrola jakości

Każdy pull request oraz każde wdrożenie uruchamiają:

- ESLint;
- formatowanie kodu;
- sprawdzenie TypeScript;
- budowę Next.js;
- podstawową budowę aplikacji Expo.

Testy jednostkowe i end-to-end nie są wymagane w pierwszym kroku, ale pierwszym kandydatem do testów będzie logika kolizji, pojemności zasobów i obciążenia konia. Są to reguły o największym ryzyku biznesowym.

### Monitoring

Sentry rejestruje błędy aplikacji webowej i mobilnej. Konfiguracja musi maskować email, telefon oraz dane zawartości lekcji w raportach błędów.

Analityka mierzy zdarzenia produktowe, a nie prywatne treści. Przykłady zdarzeń:

- utworzenie lekcji;
- zatwierdzenie prośby;
- odwołanie udziału;
- użycie widoku wolnych terminów;
- aktywny użytkownik w danym tygodniu.

### Wdrożenia

- `development`: dane testowe, osobny projekt Supabase, podgląd Vercel;
- `production`: prawdziwy ośrodek, osobny projekt Supabase, chronione sekrety;
- główna gałąź: `main`;
- zmiany produkcyjne: przez pull request i automatyczne sprawdzenia.

## 11. Plan implementacji

### Etap 0 — przygotowanie

1. Utworzenie prywatnego repozytorium GitHub.
2. Utworzenie dwóch projektów Supabase w regionie UE.
3. Utworzenie projektu Vercel i konfiguracji środowisk.
4. Konfiguracja Resend, Sentry i sekretów.
5. Utworzenie monorepo i automatycznych kontroli jakości.

### Etap 1 — fundament danych i dostęp

1. Migracje tabel organizacji, użytkowników, członkostw i zaproszeń.
2. RLS dla wszystkich tabel.
3. Aktywacja konta z zaproszenia i reset hasła.
4. Panel managera do danych ośrodka, zasobów, koni i użytkowników.
5. Nazwa oraz logo ośrodka.

### Etap 2 — kalendarz webowy

1. Widok dnia i tygodnia.
2. Tworzenie lekcji indywidualnych i grupowych.
3. Przeciąganie i zmiana długości.
4. Zasoby, instruktorzy i konie.
5. Konflikty, pojemność zasobu i obciążenie konia.
6. Serie tygodniowe i wyjątki.
7. Odwołania oraz audit log.

### Etap 3 — aplikacja mobilna

1. Logowanie, aktywacja konta i przełączanie ośrodka.
2. Widok własnych lekcji.
3. Widok wolnych terminów.
4. Prośba o termin oraz odwołanie udziału.
5. Anonimowe obłożenie hali dla pensjonariusza.
6. Instruktor: koń, płatność i własne zajęcia.

### Etap 4 — komunikacja i pilot

1. Rejestracja urządzeń Expo Push.
2. Przypomnienie 24 godziny przed jazdą.
3. Powiadomienia o zmianach i odwołaniach.
4. Ustawienia kategorii push.
5. Ręczne wprowadzenie danych pierwszego ośrodka.
6. Testy na iOS i Androidzie przez Expo Go.
7. Weryfikacja z użytkownikami i naprawa problemów.

## 12. Ryzyka techniczne

### Własny kalendarz

Własny, darmowy widok kalendarza eliminuje koszt licencji, ale jest jednym z trudniejszych elementów interfejsu. Należy ograniczyć MVP do widoku dnia/tygodnia, przeciągania, zmiany długości i prostych filtrów. Nie należy od początku tworzyć rozbudowanych widoków miesięcznych, raportów ani pełnej optymalizacji na każdy ekran.

### Darmowe plany usług

Supabase, Vercel, Resend i Sentry mają limity. Są odpowiednie dla pilotażu, ale przed wejściem do płatnego SaaS trzeba policzyć koszt użytkowników, powiadomień, maili i bazy.

### Uprawnienia

RLS i reguły serwerowe wymagają testów ręcznych dla każdej roli. Najpoważniejszym błędem byłoby ujawnienie pensjonariuszowi danych innych osób przez źle napisane zapytanie.

### Powiadomienia

Push nie daje gwarancji natychmiastowego dostarczenia. Krytyczne zmiany operacyjne muszą być widoczne także w kalendarzu po wejściu do aplikacji.

## 13. Granice MVP

MVP nie obejmuje:

- księgowości i faktur;
- płatności online;
- załączników;
- dokumentacji weterynaryjnej;
- danych medycznych;
- stajennych i zarządzania zadaniami;
- automatycznego doboru koni;
- pełnego trybu offline;
- samodzielnego zakładania ośrodków;
- systemu subskrypcji SaaS.

## 14. Stan gotowości

Nie ma już decyzji blokujących rozpoczęcie projektu. Nazwa produktu, dokładny wygląd interfejsu, cennik SaaS i publiczna strona marketingowa mogą zostać wybrane później bez zmiany fundamentu technicznego.
