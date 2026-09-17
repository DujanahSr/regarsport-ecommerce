-- Database initialization for RegarSport Microservices
CREATE DATABASE regarsport_auth;
CREATE DATABASE regarsport_catalog;
CREATE DATABASE regarsport_order;
CREATE DATABASE regarsport_payment;

GRANT ALL PRIVILEGES ON DATABASE regarsport_auth TO postgres;
GRANT ALL PRIVILEGES ON DATABASE regarsport_catalog TO postgres;
GRANT ALL PRIVILEGES ON DATABASE regarsport_order TO postgres;
GRANT ALL PRIVILEGES ON DATABASE regarsport_payment TO postgres;
