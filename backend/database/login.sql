CREATE DATABASE loginBD;

USE loginBD;

CREATE TABLE usuarios(
	id INT PRIMARY KEY auto_increment,
    name varchar(50) not null,
    username varchar(30) not null,
    email varchar(30) not null,
    password varchar(255)
);

select * from usuarios;