#!/bin/bash

# EdgePilot AI Pre-Publish Validation Script
# This script verifies the package is ready for npm publication

set -e

echo "========================================="
echo "EdgePilot AI Pre-Publish Validation"
echo "========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Function to check a condition
check() {
    local description="$1"
    local command="$2"

    printf "Checking: %s... " "$description"

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        FAILED=1
        return 1
    fi
}

# Function to run a command and show output
run_check() {
    local description="$1"
    local command="$2"

    echo ""
    echo "Running: $description"
    echo "Command: $command"
    echo "----------------------------------------"

    if eval "$command"; then
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        FAILED=1
        return 1
    fi
}

# 1. Check for required files
echo "1. Checking required files..."
check "package.json exists" "test -f package.json"
check "README.md exists" "test -f README.md"
check "LICENSE exists" "test -f LICENSE"
check "tsconfig.json exists" "test -f tsconfig.json"
check ".gitignore exists" "test -f .gitignore"

# 2. Check for lockfile
echo ""
echo "2. Checking package manager..."
if test -f pnpm-lock.yaml; then
    echo -e "${GREEN}✓ pnpm-lock.yaml found${NC}"
    PKG_MGR="pnpm"
elif test -f package-lock.json; then
    echo -e "${GREEN}✓ package-lock.json found${NC}"
    PKG_MGR="npm"
elif test -f yarn.lock; then
    echo -e "${GREEN}✓ yarn.lock found${NC}"
    PKG_MGR="yarn"
else
    echo -e "${RED}✗ No lockfile found! Run 'pnpm install' to create one${NC}"
    FAILED=1
    PKG_MGR="pnpm"
fi

# 3. Clean and install dependencies
echo ""
echo "3. Installing dependencies..."
if [ "$PKG_MGR" = "pnpm" ]; then
    run_check "Installing with pnpm" "pnpm install --frozen-lockfile"
else
    run_check "Installing with $PKG_MGR" "$PKG_MGR install"
fi

# 4. Build the package
echo ""
echo "4. Building package..."
run_check "Clean build directory" "rm -rf dist"
run_check "TypeScript compilation" "$PKG_MGR run build"

# 5. Check build output
echo ""
echo "5. Validating build output..."
check "dist directory exists" "test -d dist"
check "dist/index.js exists" "test -f dist/index.js"
check "dist/index.d.ts exists" "test -f dist/index.d.ts"
check "dist/next.js exists" "test -f dist/next.js"
check "dist/next.d.ts exists" "test -f dist/next.d.ts"

# 6. Run tests
echo ""
echo "6. Running tests..."
if command -v jest > /dev/null 2>&1; then
    run_check "Jest tests" "$PKG_MGR run test"
else
    echo -e "${YELLOW}⚠ Jest not installed globally, skipping tests${NC}"
fi

# 7. Check package contents
echo ""
echo "7. Checking package contents..."
echo "Package will include:"
npm pack --dry-run 2>&1 | grep "npm notice" | grep -E "\.js$|\.d\.ts$|\.md$|LICENSE" | head -20

# 8. Validate package.json
echo ""
echo "8. Validating package.json..."
check "name field" "npm pkg get name | grep -q 'edgepilot-ai'"
check "version field" "npm pkg get version | grep -q '\"'"
check "main field" "npm pkg get main | grep -q 'dist/index.js'"
check "types field" "npm pkg get types | grep -q 'dist/index.d.ts'"
check "author field" "npm pkg get author | grep -q '\"'"
check "license field" "npm pkg get license | grep -q '\"'"

# 9. Check for common issues
echo ""
echo "9. Checking for common issues..."
check "No .env file in package" "! npm pack --dry-run 2>&1 | grep -q '\.env'"
check "No node_modules in package" "! npm pack --dry-run 2>&1 | grep -q 'node_modules'"
check "No test files in package" "! npm pack --dry-run 2>&1 | grep -q '\.test\.(js|ts)'"

# 10. Environment variables
echo ""
echo "10. Checking environment setup..."
if [ -f .env.local.example ]; then
    echo -e "${GREEN}✓ .env.local.example found${NC}"
    echo "  Required environment variables:"
    grep -E "^[A-Z_]+" .env.local.example | sed 's/=.*//' | sed 's/^/    - /'
else
    echo -e "${YELLOW}⚠ No .env.local.example found${NC}"
fi

# Final summary
echo ""
echo "========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Package is ready to publish. Run:"
    echo "  npm publish"
    echo ""
    echo "Or for a dry run:"
    echo "  npm publish --dry-run"
else
    echo -e "${RED}❌ Some checks failed!${NC}"
    echo ""
    echo "Please fix the issues above before publishing."
    exit 1
fi

# Show package info
echo ""
echo "Package information:"
echo "  Name: $(npm pkg get name | tr -d '"')"
echo "  Version: $(npm pkg get version | tr -d '"')"
echo "  Size: $(npm pack --dry-run 2>&1 | grep 'package size:' | cut -d: -f2 | xargs)"
echo ""