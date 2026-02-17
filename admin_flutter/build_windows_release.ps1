# Build Flutter Windows app in Release mode for packaging with Inno Setup.
# Run from repo root or admin_flutter: .\build_windows_release.ps1

Set-Location $PSScriptRoot

# Try to find Flutter
$flutterCmd = "flutter"
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    # Try common Flutter installation paths
    $commonPaths = @(
        "$env:LOCALAPPDATA\flutter\bin\flutter.bat",
        "C:\src\flutter\bin\flutter.bat",
        "C:\flutter\bin\flutter.bat",
        "$env:USERPROFILE\flutter\bin\flutter.bat"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $flutterCmd = $path
            Write-Host "Found Flutter at: $path"
            break
        }
    }
    if ($flutterCmd -eq "flutter" -and -not (Test-Path $flutterCmd)) {
        Write-Error "Flutter not found in PATH or common locations."
        Write-Host ""
        Write-Host "Please either:"
        Write-Host "1. Add Flutter to your PATH (add Flutter\bin folder to PATH)"
        Write-Host "2. Or set FLUTTER_ROOT environment variable"
        Write-Host "3. Or run: flutter build windows --release manually from Flutter\bin folder"
        Write-Host ""
        Write-Host "Common Flutter locations:"
        Write-Host "  - $env:LOCALAPPDATA\flutter\bin"
        Write-Host "  - C:\src\flutter\bin"
        Write-Host "  - C:\flutter\bin"
        exit 1
    }
}

& $flutterCmd build windows --release
if ($LASTEXITCODE -ne 0) {
    Write-Error "Flutter build failed."
    exit 1
}
$releaseDir = "build\windows\x64\runner\Release"
if (-not (Test-Path $releaseDir)) {
    Write-Error "Release folder not found: $releaseDir"
    exit 1
}
Write-Host "Build complete. Output: $releaseDir"
Write-Host "Use this folder as the 'Source' in Inno Setup, or run the .iss script."
