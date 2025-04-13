# Change to the repository directory
Set-Location -Path "C:/Users/Administrator/Desktop/school/agape"

# List of files to check and potentially remove
$filesToCheck = @(
    "frontend/school-frontend-app/build/index.html",
    "frontend/school-frontend-app/public/index.html",
    "vercel.json",
    "frontend/school-frontend-app/vercel.json"
)

# Check each file to see if it contains the sample webpage content
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        if ($content -match "Agape Seminary School" -and $content -match "bootstrap") {
            Write-Host "Found sample webpage in $file"
            # Rename the file to .bak to keep a backup
            $backupFile = "$file.sample.bak"
            Copy-Item -Path $file -Destination $backupFile
            Remove-Item -Path $file -Force
            Write-Host "Backed up to $backupFile and removed original"
        }
    }
}

# Remove build directory if it contains the sample webpage
if (Test-Path "frontend/school-frontend-app/build") {
    $indexHtml = "frontend/school-frontend-app/build/index.html"
    if (Test-Path $indexHtml) {
        $content = Get-Content -Path $indexHtml -Raw
        if ($content -match "Agape Seminary School" -and $content -match "bootstrap") {
            Write-Host "Found sample webpage in build directory"
            # Remove the build directory
            Remove-Item -Path "frontend/school-frontend-app/build" -Recurse -Force
            Write-Host "Removed build directory"
        }
    }
}

# Remove any render.yaml files that might be using the sample webpage
if (Test-Path "frontend/school-frontend-app/render.yaml") {
    $content = Get-Content -Path "frontend/school-frontend-app/render.yaml" -Raw
    if ($content -match "st-john-vianey-frontend" -or $content -match "agape-seminary-frontend") {
        Write-Host "Found sample webpage configuration in render.yaml"
        # Rename the file to .bak to keep a backup
        $backupFile = "frontend/school-frontend-app/render.yaml.sample.bak"
        Copy-Item -Path "frontend/school-frontend-app/render.yaml" -Destination $backupFile
        Remove-Item -Path "frontend/school-frontend-app/render.yaml" -Force
        Write-Host "Backed up to $backupFile and removed original"
    }
}

Write-Host "Sample webpage files have been identified and removed."
