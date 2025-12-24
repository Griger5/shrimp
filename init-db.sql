create table users (
    id varchar(36) primary key not null,
    username text not null,
    email text not null,
    password_hash bytea not null
);