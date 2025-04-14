
# Get the path to the dist folder
$distPath = ".\dist"

# Find the HTML file (should be index.html)
$htmlFile = Get-ChildItem -Path $distPath -Filter "*.html" | Select-Object -First 1

if ($null -eq $htmlFile) {
    Write-Error "No HTML file found in dist folder"
    exit 1
}

# Find the JS file in the js folder
$jsFile = Get-ChildItem -Path "$distPath\js" -Filter "*.js" | Select-Object -First 1

if ($null -eq $jsFile) {
    Write-Error "No JS file found in dist/js folder"
    exit 1
}

# Read the contents of both files
$htmlContent = Get-Content -Path $htmlFile.FullName -Raw
$jsContent = Get-Content -Path $jsFile.FullName -Raw

# Create the script tag with the JS content
$scriptTag = "<script>`n$jsContent`n</script>"

# Replace the existing script reference with the embedded content
$newHtmlContent = $htmlContent -replace "<script.*?src=.*?></script>", $scriptTag

# Write the new content back to the HTML file
Set-Content -Path $htmlFile.FullName -Value $newHtmlContent -NoNewline

Write-Host "Successfully embedded JS into HTML file"