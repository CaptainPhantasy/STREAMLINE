# Test Users Documentation

**Last Updated:** Generated automatically by verify-test-users.ts script

This document lists all test users configured in the project for different roles.

## Standardized Test Users (Primary)

These are the **standardized test users** that should exist for all roles. These are created/verified by `scripts/verify-test-users.ts`.

| Role | Email | Password | Full Name | Status |
|------|-------|----------|-----------|--------|
| **owner** | `test-owner@317plumber.com` | `TestPassword123!` | Test Owner User | ⚠️ To be verified |
| **admin** | `test-admin@317plumber.com` | `TestPassword123!` | Test Admin User | ⚠️ To be verified |
| **dispatcher** | `test-dispatcher@317plumber.com` | `TestPassword123!` | Test Dispatcher User | ⚠️ To be verified |
| **tech** | `test-tech@317plumber.com` | `TestPassword123!` | Test Tech User | ⚠️ To be verified |

## Playwright Test Users

These users are defined in `tests/utils/auth-helpers.ts` for Playwright E2E tests:

| Role | Email | Password | Full Name | Storage State |
|------|-------|----------|-----------|---------------|
| **owner** | `test@317plumber.com` | `TestPassword123!` | owner User | `playwright/.auth/owner.json` |
| **admin** | `admin@317plumber.com` | `TestPassword123!` | admin User | `playwright/.auth/admin.json` |
| **dispatcher** | `dispatcher@317plumber.com` | `TestPassword123!` | dispatcher User | `playwright/.auth/dispatcher.json` |
| **tech** | `tech@317plumber.com` | `TestPassword123!` | tech User | `playwright/.auth/tech.json` |

## Reset Test Passwords Script Users

These users are defined in `scripts/reset-test-passwords.ts`:

| Role | Email | Password | Full Name |
|------|-------|----------|-----------|
| **owner** | `ryan@317plumber.com` | `Password123!` | Ryan Galbraith |
| **admin** | `cecily@317plumber.com` | `Password123!` | Cecily Turner |
| **dispatcher** | `maria@317plumber.com` | `Password123!` | Maria Lopez |
| **tech** | `tom@317plumber.com` | `Password123!` | Tom "TJ" Jackson |
| **admin** (Sales) | `sarah@317plumber.com` | `Password123!` | Sarah Miller (Sales) |

## 317PLUMBER Team Users

These users are defined in `scripts/setup-317plumber-users.ts` for the full team directory. Default password: `317Plumber2025!`

### Executive
- **owner**: `ryan@317plumber.com` - Ryan Galbraith
- **admin**: `cecily@317plumber.com` - Cecily Turner

### Dispatch & Office
- **dispatcher**: `maria.lopez@317plumber.com` - Maria Lopez
- **dispatcher**: `kevin.sandler@317plumber.com` - Kevin Sandler

### Field Technicians
- **tech**: `tj.jackson@317plumber.com` - Tom "TJ" Jackson
- **tech**: `derrick.hayes@317plumber.com` - Derrick Hayes
- **tech**: `luis.ramirez@317plumber.com` - Luis Ramirez
- **tech**: `nathan.cole@317plumber.com` - Nathan Cole
- **tech**: `shawn.becker@317plumber.com` - Shawn Becker
- **tech**: `mikey.torres@317plumber.com` - Michael "Mikey" Torres
- **tech**: `andre.whitmore@317plumber.com` - Andre Whitmore
- **tech**: `evan.stokes@317plumber.com` - Evan Stokes
- **tech**: `brian.oleary@317plumber.com` - Brian O'Leary
- **tech**: `jim.parkhurst@317plumber.com` - Jim Parkhurst
- **tech**: `garrett.james@317plumber.com` - Garrett James
- **tech**: `jackson.miller@317plumber.com` - Jackson Miller

### Management
- **admin**: `michelle.carter@317plumber.com` - Michelle Carter
- **admin**: `bobby.harmon@317plumber.com` - Robert "Bobby" Harmon

### Sales
- **admin**: `evan.brewer@317plumber.com` - Evan Brewer
- **admin**: `zoe.cross@317plumber.com` - Zoe Cross

## Quick Reference: Recommended Test Users

For **testing purposes**, use these standardized credentials:

### Owner Role
- **Email**: `test-owner@317plumber.com`
- **Password**: `TestPassword123!`

### Admin Role
- **Email**: `test-admin@317plumber.com`
- **Password**: `TestPassword123!`

### Dispatcher Role
- **Email**: `test-dispatcher@317plumber.com`
- **Password**: `TestPassword123!`

### Tech Role
- **Email**: `test-tech@317plumber.com`
- **Password**: `TestPassword123!`

## Verification

To verify and create all test users, run:

```bash
npx tsx scripts/verify-test-users.ts
```

This script will:
1. Check which test users exist for each role
2. Create missing test users
3. Update existing users to ensure correct roles
4. Display a summary of all test user credentials

## Notes

- All test users should be associated with the `317plumber` account
- Test users are created with `email_confirm: true` to skip email verification
- Passwords should be changed in production environments
- The standardized test users (`test-*@317plumber.com`) are recommended for automated testing
- The Playwright test users are used specifically for E2E test automation

