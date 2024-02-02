#!/bin/bash

PROJECT_DIR=`git rev-parse --show-toplevel`
source $PROJECT_DIR/.env
DATE=$(date +%F-%H-%M-%S)
OUTPUT_FILE_NAME="${DATE}_database_dump_${DB_DATABASE}.sql"
OUTPUT_PATH=$PROJECT_DIR/backups
OUTPUT_FILE=$OUTPUT_PATH/$OUTPUT_FILE_NAME


mkdir -p $OUTPUT_PATH

mysqldump \
  --user=$DB_USERNAME \
  --password=$DB_PASSWORD \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --add-drop-database \
  --skip-comments \
  --no-tablespaces \
  --result-file="$OUTPUT_FILE" \
  $DB_DATABASE