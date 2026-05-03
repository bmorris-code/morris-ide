#!/bin/bash

# Morris IDE Release Script
# Usage: ./scripts/release.sh [version]

set -e

VERSION=${1:-"1.0.0"}
echo "🚀 Releasing Morris IDE v$VERSION"

# Check if we're on main branch
if [[ $(git branch --show-current) != "main" ]]; then
    echo "❌ Please switch to main branch first"
    exit 1
fi

# Check if working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Working directory is not clean. Please commit changes first."
    exit 1
fi

# Update version in package.json
echo "📝 Updating version to $VERSION"
npm version $VERSION --no-git-tag-version

# Commit version change
git add package.json
git commit -m "🔖 Bump version to $VERSION"

# Create and push tag
echo "🏷️  Creating tag v$VERSION"
git tag -a "v$VERSION" -m "Morris IDE v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "✅ Release v$VERSION created successfully!"
echo "📦 GitHub Actions will build all platforms automatically."
echo "🔗 Check releases at: https://github.com/morris-ide/morris-ide/releases"
