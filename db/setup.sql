\set ON_ERROR_STOP on

\connect postgres

DROP DATABASE IF EXISTS nc_plus_one WITH (FORCE);
CREATE DATABASE nc_plus_one;
