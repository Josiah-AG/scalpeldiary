#!/bin/bash

# First, get a token by logging in as chief resident
echo "Getting auth token..."

# You'll need to replace these with actual credentials
# For now, let's just test if the categories endpoint works

echo "Testing duty categories endpoint..."
curl -X GET http://localhost:3000/api/duties/categories \
  -H "Content-Type: application/json" \
  2>&1

echo -e "\n\nDone!"
