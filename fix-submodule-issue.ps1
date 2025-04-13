# Remove the backup directory if it exists
if (Test-Path -Path "backup") {
  Write-Host "Removing backup directory..."
  Remove-Item -Path "backup" -Recurse -Force
}

# Add and commit the changes
git add .gitmodules
git commit -m "Fix submodule issue by adding empty .gitmodules file"
git push

Write-Host "Fix completed. Please check your Koyeb deployment."
