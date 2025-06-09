#!/usr/bin/env bash
set -e

/opt/wait-for-it.sh ${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432}
npm run migration:run
npm run seed:run:relational
npm run start:prod > prod.log 2>&1 &
/opt/wait-for-it.sh ${MAILDEV_HOST:-maildev}:${MAILDEV_PORT:-1080}
#/opt/wait-for-it.sh ${API_HOST:-localhost}:${API_PORT:-3000}
npm run lint
#npm run test:e2e -- --runInBand
