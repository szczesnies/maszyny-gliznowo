create table if not exists machines (
  id bigint unsigned not null auto_increment primary key,
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
  index machines_status_id_idx (status, id),
  index machines_index_number_idx (index_number)
);

create table if not exists machine_history (
  id bigint unsigned not null auto_increment primary key,
  machine_id bigint unsigned not null,
  action varchar(255) not null,
  details text null,
  created_at timestamp not null default current_timestamp,
  index machine_history_machine_created_idx (machine_id, created_at),
  constraint machine_history_machine_fk
    foreign key (machine_id) references machines(id)
    on delete cascade
);
