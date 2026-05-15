# Backup bazy i zdjec na Hostingerze

## Backup bazy MySQL

W SSH uruchom:

```bash
mkdir -p ~/backups
mysqldump -u uzytkownik_bazy -p nazwa_bazy > ~/backups/maszyny-$(date +%F-%H%M).sql
```

Przy Twoich zmiennych podstaw:

```bash
mysqldump -u MYSQL_USER -p MYSQL_DATABASE > ~/backups/maszyny-$(date +%F-%H%M).sql
```

## Backup zdjec

Zdjecia sa w:

```bash
/home/USER/domains/DOMAIN/nodejs/public/uploads/machines
```

Przyklad:

```bash
tar -czf ~/backups/maszyny-zdjecia-$(date +%F-%H%M).tar.gz -C /home/USER/domains/DOMAIN/nodejs/public uploads
```

## Odtwarzanie bazy

```bash
mysql -u MYSQL_USER -p MYSQL_DATABASE < backup.sql
```

## Rekomendacja

Rób backup przed:

- wieksza aktualizacja aplikacji,
- zmiana struktury bazy,
- czyszczeniem archiwum,
- masowym dodawaniem/usuwaniem zdjec.

