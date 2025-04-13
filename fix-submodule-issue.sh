#!/bin/bash

# Remove the backup directory if it exists
if [ -d "backup" ]; then
  echo "Removing backup directory..."
  rm -rf backup
fi

# Add and commit the changes
git add .gitmodules
git commit -m "Fix submodule issue by adding empty .gitmodules file"
git push

echo "Fix completed. Please check your Koyeb deployment."
