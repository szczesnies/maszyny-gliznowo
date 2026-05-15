-- Maszyny Gliznowo - czysta baza MySQL / MariaDB dla Hostingera
-- Importuj ten plik w phpMyAdmin po utworzeniu pustej bazy danych.
-- Plik tworzy tylko tabele aplikacji. Nie tworzy uzytkownika ani samej bazy.

set names utf8mb4;
set foreign_key_checks = 0;

drop table if exists machine_history;
drop table if exists machines;

set foreign_key_checks = 1;

create table machines (
  id bigint unsigned not null auto_increment,
  name varchar(255) not null,
  index_number varchar(100) null,
  purchase_price varchar(100) null,
  vat_price varchar(100) null,
  gross_price varchar(100) null,
  description text null,
  note text null,
  image1 varchar(500) null,
  image2 varchar(500) null,
  image3 varchar(500) null,
  image4 varchar(500) null,
  status enum('available', 'sold') not null default 'available',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  key machines_status_id_idx (status, id),
  key machines_index_number_idx (index_number)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table machine_history (
  id bigint unsigned not null auto_increment,
  machine_id bigint unsigned not null,
  action varchar(255) not null,
  details text null,
  created_at timestamp not null default current_timestamp,
  primary key (id),
  key machine_history_machine_created_idx (machine_id, created_at),
  constraint machine_history_machine_fk
    foreign key (machine_id) references machines(id)
    on delete cascade
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
