# Maszyny Gliznowo - wdrozenie na Hostingerze

## 1. Baza danych

W panelu Hostingera utworz baze MySQL/MariaDB, a potem uruchom SQL z pliku:

`supabase/hostinger_mysql.sql`

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

Domyslnie zdjecia zapisuja sie do:

`public/uploads/machines`

Jesli Hostinger wymaga innej sciezki zapisu, ustaw:

```env
UPLOAD_DIR=/pelna/sciezka/do/uploads/machines
UPLOAD_PUBLIC_PREFIX=/uploads/machines
```

## 4. Komendy

```bash
npm install
npm run build
npm run start
```

## 5. Co zostalo zmienione

Supabase zostal zastapiony przez:

- API routes w Next.js: `app/api`
- MySQL przez `mysql2`
- logowanie przez ciasteczko `httpOnly`
- upload plikow na serwer

