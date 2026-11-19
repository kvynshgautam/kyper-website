<#
.SYNOPSIS
    KYPER 1-Click Release Updater
    Engineered by Kavyansh Gautam (KG)

.DESCRIPTION
    Automatically syncs new APK or Extension builds into the website's download repository,
    re-calculates SHA-256 checksums, and updates public/data/updates.json seamlessly.

.EXAMPLE
    .\update-release.ps1
    .\update-release.ps1 -Version "6.2" -Changelog "Added Instagram voice note transcriber"
#>

param (
    [string]$Version = "v6.1",
    [string]$ApkPath = "C:\Users\Kavyansh\Documents\GhostTyper-Android\Kyper-latest.apk",
    [string]$ExtPath = "C:\Users\Kavyansh\Documents\Kyper-extension.zip",
    [string]$Changelog = "Maintenance and performance update"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$downloadsDir = Join-Path $scriptDir "public\downloads"
$updatesJsonPath = Join-Path $scriptDir "public\data\updates.json"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "⚡ KYPER 1-CLICK RELEASE DEPLOYER" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Fallback paths if Kyper prefix not yet present
if (-not (Test-Path $ApkPath)) {
    $fallbackApk = "C:\Users\Kavyansh\Documents\GhostTyper-Android\GhostTyper-latest.apk"
    if (Test-Path $fallbackApk) { $ApkPath = $fallbackApk }
}
if (-not (Test-Path $ExtPath)) {
    $fallbackExt = "C:\Users\Kavyansh\Documents\GhostTyper-extension.zip"
    if (Test-Path $fallbackExt) { $ExtPath = $fallbackExt }
}

# 1. Sync Android APK if found
if (Test-Path $ApkPath) {
    Write-Host "[1/3] Copying latest APK from $ApkPath..." -ForegroundColor Green
    $destApk = Join-Path $downloadsDir "Kyper-latest.apk"
    Copy-Item $ApkPath $destApk -Force

    # Also keep alias for backward compatibility
    Copy-Item $destApk (Join-Path $downloadsDir "GhostTyper-latest.apk") -Force

    $apkHash = (Get-FileHash $destApk -Algorithm SHA256).Hash
    $apkItem = Get-Item $destApk
    $apkSizeMB = [math]::Round($apkItem.Length / 1MB, 2)
    $apkSizeFormatted = "$apkSizeMB MB"

    Write-Host "      ✓ Synced APK: $apkSizeFormatted (SHA-256: $apkHash)" -ForegroundColor Gray
} else {
    Write-Host "[!] Warning: Source APK not found at $ApkPath" -ForegroundColor Yellow
}

# 2. Sync Extension Zip if found
if (Test-Path $ExtPath) {
    Write-Host "[2/3] Copying latest Extension from $ExtPath..." -ForegroundColor Green
    $destExt = Join-Path $downloadsDir "Kyper-extension.zip"
    Copy-Item $ExtPath $destExt -Force

    # Also keep alias
    Copy-Item $destExt (Join-Path $downloadsDir "GhostTyper-extension.zip") -Force

    $extHash = (Get-FileHash $destExt -Algorithm SHA256).Hash
    $extItem = Get-Item $destExt
    $extSizeKB = [math]::Round($extItem.Length / 1KB, 1)
    $extSizeFormatted = "$extSizeKB KB"

    Write-Host "      ✓ Synced Extension: $extSizeFormatted (SHA-256: $extHash)" -ForegroundColor Gray
}

# 3. Update public/data/updates.json
if (Test-Path $updatesJsonPath) {
    Write-Host "[3/3] Updating metadata in $updatesJsonPath..." -ForegroundColor Green
    $json = Get-Content $updatesJsonPath -Raw | ConvertFrom-Json

    if ($apkHash) {
        $json.latestAndroid.version = $Version
        $json.latestAndroid.fileName = "Kyper-$Version.apk"
        $json.latestAndroid.downloadUrl = "https://github.com/kvynshgautam/kyper-website/releases/latest/download/Kyper-latest.apk"
        $json.latestAndroid.sha256 = $apkHash
        $json.latestAndroid.fileSizeBytes = $apkItem.Length
        $json.latestAndroid.fileSizeFormatted = $apkSizeFormatted
        $json.latestAndroid.releaseDate = (Get-Date).ToString("MMMM dd, yyyy")
    }

    if ($extHash) {
        $json.latestExtension.fileName = "Kyper-extension.zip"
        $json.latestExtension.downloadUrl = "https://github.com/kvynshgautam/kyper-website/releases/latest/download/Kyper-extension.zip"
        $json.latestExtension.sha256 = $extHash
        $json.latestExtension.fileSizeBytes = $extItem.Length
        $json.latestExtension.fileSizeFormatted = $extSizeFormatted
        $json.latestExtension.releaseDate = (Get-Date).ToString("MMMM dd, yyyy")
    }

    $json | ConvertTo-Json -Depth 10 | Set-Content $updatesJsonPath -Encoding UTF8
    Write-Host "      ✓ updates.json updated successfully!" -ForegroundColor Green
}

# 4. Optional: Sync to GitHub Releases
try {
    $apkFile = Join-Path $downloadsDir "Kyper-latest.apk"
    $extFile = Join-Path $downloadsDir "Kyper-extension.zip"
    if ((Test-Path $apkFile) -and (Test-Path $extFile)) {
        Write-Host "[4/4] Syncing binaries to GitHub Release CDN..." -ForegroundColor Green
        gh release create $Version $apkFile $extFile --title "KYPER $Version — Autonomous AI Communicator" --notes $Changelog --repo "kvynshgautam/kyper-website" --clobber
        Write-Host "      ✓ GitHub Release CDN updated!" -ForegroundColor Green
    }
} catch {
    Write-Host "      [!] Note: GitHub release skipped ($($_.Exception.Message))" -ForegroundColor Gray
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🎉 SUCCESS! Website release repository updated to $Version (KYPER)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
