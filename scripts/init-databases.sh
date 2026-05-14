#!/bin/bash
# Runs once during postgres image's initdb phase. Connects to the freshly-
# created POSTGRES_DB (since the cluster has no other database yet) and
# provisions any additional databases the app needs.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE trustalo_collector;
EOSQL
