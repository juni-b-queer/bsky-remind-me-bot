#!/bin/bash

PROJECT_DIR=`git rev-parse --show-toplevel`

source $PROJECT_DIR/.env
if [ $# -eq 0 ]
then
    echo "Please give an SQL file to import as a parameter."
    exit 1;
fi

cat $1 | mysql \
    --host=${2:-$DB_HOST} \
    --port=${3:-$DB_PORT} \
    --user=${4:-$DB_USERNAME} \
    --password=${5:-$DB_PASSWORD} \
    ${6:-$DB_DATABASE}
