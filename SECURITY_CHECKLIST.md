# Security checklist po wdrozeniu

Po kazdym screenie lub udostepnieniu ustawien zmien:

- `AUTH_SECRET`
- `ADMIN_PASSWORD`
- hasla w `APP_USERS`
- `MYSQL_PASSWORD`, jesli byl pokazany publicznie

Zasady:

- nie wrzucaj prawdziwego `.env` do repozytorium,
- w repo trzymaj tylko `.env.example`,
- po zmianie `AUTH_SECRET` wszyscy uzytkownicy beda musieli zalogowac sie ponownie,
- po zmianie zmiennych srodowiskowych zawsze zrob restart aplikacji albo ponowne wdrozenie.

Minimalne zmienne produkcyjne:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=...
AUTH_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

Wiele kont:

```env
APP_USERS=[{"email":"admin@example.com","password":"mocne-haslo"},{"email":"pracownik@example.com","password":"inne-mocne-haslo"}]
```

