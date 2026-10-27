CREATE DATABASE loginBD;

USE loginBD;

CREATE TABLE usuarios(
	id INT PRIMARY KEY auto_increment,
    name varchar(50) not null,
    username varchar(30) not null,
    email varchar(255) not null,
    password varchar(255),
    UNIQUE KEY uq_usuarios_email (email),
    UNIQUE KEY uq_usuarios_username (username)
);

select * from usuarios;