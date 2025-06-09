# Build script for League Client Events

# Create build directories
New-Item -ItemType Directory -Force -Path "build/bin"

# Build the frontend
Write-Host "Building frontend..."
Set-Location frontend
npm run build
Set-Location ..

# Build the Wails application with NSIS installer
Write-Host "Building Wails application..."
wails build -platform windows/amd64 -o "build/bin/lcu-events.exe" -nsis

Write-Host "Build complete! Installer created in the build directory." 