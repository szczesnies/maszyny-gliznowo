# Maszyny Gliznowo - wdrozenie na Hostingerze

## 1. Baza danych

W panelu Hostingera utworz baze MySQL/MariaDB, a potem uruchom SQL z pliku:

`database/hostinger_mysql.sql`

Tworzy on tabele:

- `machines`
- `machine_history`

## 2. Zmienne srodowiskowe

Na Hostingerze ustaw zmienne zgodnie z `.env.example`:

```env
MYSQL_HOST=...
MYSQL_PORT=3306
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=...
AUTH_SECRET=dlugi-losowy-sekret
ADMIN_EMAIL=twoj-email
ADMIN_PASSWORD=twoje-haslo
```

Mozesz tez uzyc wielu kont:

```env
APP_USERS=[{"email":"admin@example.com","password":"haslo1"},{"email":"pracownik@example.com","password":"haslo2"}]
```

## 3. Zdjecia

Zdjecia zapisuja sie do:

`public/uploads/machines`

Upewnij sie, ze aplikacja Node.js ma prawo zapisu do tego katalogu. Limit pojedynczego zdjecia ustawisz opcjonalnie:

```env
MAX_IMAGE_SIZE=5242880
```

## 4. Komendy

```bash
npm install
npm run build
npm run start
```

## 5. Co zostalo zmienione

Backend aplikacji dziala teraz przez:

- API routes w Next.js: `app/api`
- MySQL przez `mysql2`
- logowanie przez ciasteczko `httpOnly`
- upload plikow na serwer

