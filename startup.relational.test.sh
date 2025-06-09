#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh ${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432}
/opt/wait-for-it.sh ${MAILDEV_HOST:-maildev}:${MAILDEV_PORT:-1080}
npm install
npm run migration:run
npm run seed:run:relational
npm run start:dev
