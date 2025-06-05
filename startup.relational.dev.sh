#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}
npm run migration:run
npm run seed:run:relational
npm run start:prod
