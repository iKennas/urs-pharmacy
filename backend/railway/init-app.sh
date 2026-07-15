#!/bin/bash
set -e
npx prisma db push
npx tsx prisma/seed.ts
