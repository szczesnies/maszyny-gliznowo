# Czyste wdrozenie Hostinger

Ta instrukcja jest dla resetu strony `gliznowo.pl` i ponownego wdrozenia aplikacji z repozytorium GitHub.

## 1. Baza danych

1. W Hostingerze utworz nowa baze MySQL.
2. Zapisz:
   - host,
   - nazwe bazy,
   - uzytkownika,
   - haslo.
3. W phpMyAdmin wybierz nowa baze i zaimportuj:
   - `database/hostinger_fresh_database.sql`

## 2. Zmienne srodowiskowe

Ustaw w Hostingerze:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=twoj_uzytkownik
MYSQL_PASSWORD=twoje_haslo
MYSQL_DATABASE=twoja_baza
MYSQL_CONNECTION_LIMIT=2
MYSQL_MAX_IDLE=2
MYSQL_IDLE_TIMEOUT=60000

AUTH_SECRET=wygeneruj-dlugi-losowy-sekret-minimum-32-znaki
ADMIN_EMAIL=admin@gliznowo.pl
ADMIN_PASSWORD=ustaw_mocne_haslo
MAX_IMAGE_SIZE=5242880
```

Dla dwoch kont zamiast `ADMIN_EMAIL` i `ADMIN_PASSWORD` mozesz uzyc jednej zmiennej:

```env
APP_USERS=[{"email":"admin@gliznowo.pl","password":"haslo1"},{"email":"pracownik@gliznowo.pl","password":"haslo2"}]
```

## 3. Wdrozenie z GitHub

Ustawienia zalecane:

- Framework: `Next.js`
- Branch: `main`
- Build command: `npm run build`
- Start command: `npm run start`
- Output directory: `.next`
- Node.js: `20.x` albo `22.x`

Nie ustawiaj katalogu na `public_html` dla aplikacji Node.js.

## 4. Po wdrozeniu

Sprawdz w SSH:

```bash
cd /home/u251717226/domains/gliznowo.pl/nodejs
cat package.json
ls -la .next
```

Sprawdz aplikacje:

```bash
curl -I https://gliznowo.pl/login
curl -I https://gliznowo.pl/
curl -I https://gliznowo.pl/manifest.json
```

`/login` i `/` powinny zwracac `200`.

## 5. Wazne

Nie kopiuj recznie `.next/static` do `public_html`, jesli nowe wdrozenie Node.js dziala poprawnie. Te reczne obejscia byly tylko awaryjne przy poprzednim uszkodzonym wdrozeniu.
