#!/bin/sh
# Dualis unify — YOU run this. CHECKOUT_OPEN stays false. Never bind /* .
set -e
cd "$(dirname "$0")"
echo "npx wrangler d1 create dualis-unity"
echo "npx wrangler d1 execute dualis-unity --remote --file=d1-unity.schema.sql"
echo "npx wrangler secret put STRIPE_IDENTITY_SECRET"
echo "npx wrangler secret put STRIPE_WEBHOOK_SECRET"
echo "npx wrangler deploy"
echo "STOP: no route /*  no CHECKOUT_OPEN=true until HMAC-green"
