Write-Host "Compiling project..." -ForegroundColor Green
$result = & pnpm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Creating VSIX package..." -ForegroundColor Green
$result = & vsce package
if ($LASTEXITCODE -ne 0) {
    Write-Host "Package creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Installing extension to Cursor..." -ForegroundColor Green
$result = & cursor --install-extension ai-code-assistant-1.0.0.vsix
if ($LASTEXITCODE -ne 0) {
    Write-Host "Extension installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Done! Extension installed successfully." -ForegroundColor Green 