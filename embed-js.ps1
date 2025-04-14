# Get the JS file from the dist/js folder
$jsFile = Get-ChildItem -Path "dist/js/*.js" | Select-Object -First 1

if ($null -eq $jsFile) {
    Write-Error "No JavaScript file found in dist/js folder"
    exit 1
}

# Get the HTML file
$htmlFile = Get-ChildItem -Path "dist/*.html" | Select-Object -First 1

if ($null -eq $htmlFile) {
    Write-Error "No HTML file found in dist folder"
    exit 1
}

# Read the contents of both files
$jsContent = Get-Content -Path $jsFile.FullName -Raw
$htmlContent = Get-Content -Path $htmlFile.FullName -Raw

# Create the script tag with the JS content
$scriptTag = "`n<script>`n$jsContent`n</script>`n</body>"

# Replace the closing body tag with our script tag + closing body tag
$newHtmlContent = $htmlContent -replace "</body>", $scriptTag

# Write the new content back to the HTML file
$newHtmlContent | Set-Content -Path $htmlFile.FullName -Force

Write-Host "Successfully embedded JS into HTML file"