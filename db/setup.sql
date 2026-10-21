\set ON_ERROR_STOP on

-- Use the maintenance database so nc_plus_one can be dropped safely.
\connect postgres

DROP DATABASE IF EXISTS nc_plus_one WITH (FORCE);
CREATE DATABASE nc_plus_one;
