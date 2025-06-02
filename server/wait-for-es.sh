#!/bin/bash

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."

until curl -s "http://elasticsearch:9200/_cluster/health" > /dev/null; do
  echo "Elasticsearch is unavailable - sleeping"
  sleep 5
done

echo "Elasticsearch is ready - starting application"
exec "$@" 