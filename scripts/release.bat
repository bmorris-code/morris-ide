@echo off
REM Morris IDE Release Script for Windows
REM Usage: scripts\release.bat [version]

setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=1.0.0

echo 🚀 Releasing Morris IDE v%VERSION%

REM Check if we're on main branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if not "%CURRENT_BRANCH%"=="main" (
    echo ❌ Please switch to main branch first
    exit /b 1
)

REM Check if working directory is clean
for /f "tokens=*" %%i in ('git status --porcelain') do set GIT_STATUS=%%i
if not "%GIT_STATUS%"=="" (
    echo ❌ Working directory is not clean. Please commit changes first.
    exit /b 1
)

REM Update version in package.json
echo 📝 Updating version to %VERSION%
npm version %VERSION% --no-git-tag-version

REM Commit version change
git add package.json
git commit -m "🔖 Bump version to %VERSION%"

REM Create and push tag
echo 🏷️  Creating tag v%VERSION%
git tag -a "v%VERSION%" -m "Morris IDE v%VERSION%"
git push origin main
git push origin "v%VERSION%

echo ✅ Release v%VERSION% created successfully!
echo 📦 GitHub Actions will build all platforms automatically.
echo 🔗 Check releases at: https://github.com/morris-ide/morris-ide/releases
