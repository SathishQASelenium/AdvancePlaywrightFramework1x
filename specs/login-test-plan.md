# TTA Cart — Login Test Plan

## Application Overview

# TTA Cart — Login Test Plan

> **Application:** TTA Cart (`https://app.thetestingacademy.com/playwright/ttacart/`)
> **Scope:** Login page (`index.html`) — all 6 accepted users + negative cases
> **Page Object:** `LoginPage` (`src/pages/LoginPage.ts`)
> **Existing coverage:** `src/tests/tests/login.spec.ts` covers happy path for `standard_user` only.

## Login Page — Discovered Structure

| Element | Selector | Type | Notes |
|---|---|---|---|
| Username input | `[data-test="username"]` | text | `id="user-name"`, `required`, `autocomplete="username"` |
| Password input | `[data-test="password"]` | password | `required`, `autocomplete="current-password"` |
| Login button | `[data-test="login-button"]` | submit | `class="login-btn"` |
| Error box | `[data-test="error"]` | div (role=alert) | Empty when no error; prefix `"Epic sadface:"` |
| Credentials hint | `[data-test="login-credentials"]` | div | Lists 6 valid usernames + password |

## Accepted Usernames (from `loginCredentialsHint`)

| Username | Behaviour observed | Type |
|---|---|---|
| `standard_user` | Logs in → /inventory | Standard |
| `locked_out_user` | Stays on /; error: locked out | Locked |
| `problem_user` | Logs in (UI glitches possible) | Problem |
| `performance_glitch_user` | Logs in after ~3s delay | Performance |
| `error_user` | Logs in; actions may produce errors | Error-prone |
| `visual_user` | Logs in; visual layout differences | Visual |

Password for all: `tta_secret`

## Coverage Gap vs. Existing Tests

| Area | Existing | Gap |
|---|---|---|
| Happy path standard_user | ✅ | — |
| All 6 user personas | ❌ | TC-001 to TC-006 |
| Logout from each user | ❌ | TC-007 (serial) |
| Empty / unknown / wrong creds | ❌ | TC-101 to TC-105 |
| Security (SQLi, whitespace, case) | ❌ | TC-106 to TC-108 |
| Error message clearing | ❌ | TC-109 |
| Form attributes (a11y) | ❌ | TC-201 to TC-207 |
| Keyboard (Enter to submit) | ❌ | TC-208 |
| Browser back / deep-link auth | ❌ | TC-209, TC-210 |
| Long input / unicode | ❌ | TC-211, TC-212 |

## Summary

| Metric | Count |
|---|---|
| Total scenarios | 29 |
| P0 | 9 |
| P1 | 8 |
| P2 | 12 |
| New (all) | 29 |
| Existing | 0 (1 happy path already in login.spec.ts) |

## Recommended CI Execution Order

1. **Smoke gate** — TC-001 (`standard_user`) + TC-002 (`locked_out_user`) + TC-101 (empty)
2. **Login core** — TC-001..TC-007, TC-101..TC-109
3. **Form / a11y** — TC-201..TC-212

## Framework Notes

- Use `loginPage` from `@fixtures/test-base` (UI fixture)
- Use `loginPage.loginAs(user, pass)` for fill+submit
- Use `loginPage.errorBox` to assert error text
- Wrap logout loop in `test.describe.serial` (TC-007) to avoid state bleed
- Performance user (TC-004) needs `await expect(...).toHaveURL(/inventory/, { timeout: 15_000 })`
- Pre-existing `login.spec.ts` happy path can be removed once TC-001 lands in `login-all-users.spec.ts`

## Test Files to Create

| File | Tests |
|---|---|
| `src/tests/tests/login-all-users.spec.ts` | TC-001..TC-007 |
| `src/tests/tests/login-negative.spec.ts` | TC-101..TC-109 |
| `src/tests/tests/login-form.spec.ts` | TC-201..TC-212 |

## Test Scenarios

### 1. Login — All Accepted Users

**Seed:** `src/tests/seed.spec.ts`

#### 1.1. TC-001: Login as standard_user succeeds @P0 @regression @smoke

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. loginPage.open() then loginAs('standard_user', 'tta_secret')
    - expect: Navigated to /playwright/ttacart/inventory and inventory heading 'Products' is visible

#### 1.2. TC-002: Login as locked_out_user is blocked @P0 @regression

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. loginPage.open() then loginAs('locked_out_user', 'tta_secret'); assert error text
    - expect: URL stays on /; error box contains 'Epic sadface: Sorry, this user has been locked out.'

#### 1.3. TC-003: Login as problem_user reaches inventory @P1 @regression

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. loginPage.open() then loginAs('problem_user', 'tta_secret')
    - expect: URL is /inventory; page title is 'TTACart - Products'

#### 1.4. TC-004: Login as performance_glitch_user eventually reaches inventory @P1 @regression

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. loginPage.open() then loginAs('performance_glitch_user', 'tta_secret') with relaxed timeout
    - expect: Within 15s, URL is /inventory

#### 1.5. TC-005: Login as error_user reaches inventory @P1 @regression

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. loginPage.open() then loginAs('error_user', 'tta_secret')
    - expect: URL is /inventory

#### 1.6. TC-006: Login as visual_user reaches inventory @P1 @regression

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. loginPage.open() then loginAs('visual_user', 'tta_secret')
    - expect: URL is /inventory

#### 1.7. TC-007: Each valid user can logout from inventory @P0 @regression @serial

**File:** `src/tests/tests/login-all-users.spec.ts`

**Steps:**
  1. test.describe.serial: for each user — login, open menu, click logout, assert URL
    - expect: User returns to /; login-button is visible; error box is empty

### 2. Login — Negative Cases

**Seed:** `src/tests/seed.spec.ts`

#### 2.1. TC-101: Empty username + empty password — browser blocks submit @P0 @regression

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); clear fields; click login-button; expect loginButton still visible
    - expect: URL stays on /; error box remains empty; native HTML5 validation prevents submission

#### 2.2. TC-102: Empty username + valid password shows required error @P0 @regression

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill password='tta_secret' only; click login
    - expect: Error box contains 'Username is required'

#### 2.3. TC-103: Valid username + empty password shows required error @P0 @regression

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill username='standard_user' only; click login
    - expect: Error box contains 'Password is required'

#### 2.4. TC-104: Unknown username + valid password shows mismatch error @P0 @regression

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill username='fake_user', password='tta_secret'; click login
    - expect: Error box contains 'do not match any user in this service'

#### 2.5. TC-105: Valid username + wrong password shows mismatch error @P0 @regression

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill username='standard_user', password='wrong_password'; click login
    - expect: Error box contains 'do not match any user in this service'

#### 2.6. TC-106: SQL-injection-style username is rejected @P2 @security

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill username with SQLi payload, password='tta_secret'; click login
    - expect: Error box contains 'do not match any user'

#### 2.7. TC-107: Username with leading/trailing whitespace is rejected @P2

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill username=' standard_user ', password='tta_secret'; click login
    - expect: Error box shows mismatch (or login fails)

#### 2.8. TC-108: Case-sensitivity — uppercase username is rejected @P2

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); fill username='STANDARD_USER', password='tta_secret'; click login
    - expect: Error box shows mismatch

#### 2.9. TC-109: Error message is cleared after typing new input @P1

**File:** `src/tests/tests/login-negative.spec.ts`

**Steps:**
  1. loginPage.open(); submit invalid creds; assert error visible; type into username field; assert error is cleared
    - expect: After login error appears, typing into username clears the error box text

### 3. Login — Form & UI Behaviour

**Seed:** `src/tests/seed.spec.ts`

#### 3.1. TC-201: Login page heading 'TTACart' is visible @P2

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); expect heading is visible
    - expect: heading 'TTACart' is visible

#### 3.2. TC-202: Credentials hint lists all 6 accepted usernames @P2

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); read loginCredentialsHint text
    - expect: hint text contains standard_user, locked_out_user, problem_user, performance_glitch_user, error_user, visual_user, tta_secret

#### 3.3. TC-203: Username input has correct autocomplete @P2 @a11y

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); inspect username input attributes
    - expect: attribute autocomplete='username'

#### 3.4. TC-204: Password input has correct autocomplete @P2 @a11y

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); inspect password input type
    - expect: attribute autocomplete='current-password'

#### 3.5. TC-205: Login button is type='submit' @P2

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); inspect button attribute
    - expect: login-button has type=submit

#### 3.6. TC-206: Password field masks input @P2 @security

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); inspect password input type
    - expect: password input has type='password'

#### 3.7. TC-207: Error box has role='alert' for accessibility @P2 @a11y

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); inspect error box role attribute
    - expect: error box has role='alert'

#### 3.8. TC-208: Submit form by pressing Enter in password field @P1

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); fill username + password; press Enter; assert navigation
    - expect: Navigated to /inventory

#### 3.9. TC-209: Browser back after login lands on login @P2

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. login as standard_user; page.goBack(); expect login button visible
    - expect: browser back from /inventory shows login page

#### 3.10. TC-210: Direct navigation to /inventory without auth redirects to / @P1 @security

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. open /playwright/ttacart/inventory.html directly; expect URL = /
    - expect: Visiting /inventory.html while unauthenticated lands on /

#### 3.11. TC-211: Long username does not break form @P2 @boundary

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); fill username with 1000 'a' chars; click login
    - expect: Form submits; app responds with mismatch error

#### 3.12. TC-212: Unicode username is rejected gracefully @P2

**File:** `src/tests/tests/login-form.spec.ts`

**Steps:**
  1. loginPage.open(); fill unicode username, password='tta_secret'; click login
    - expect: Form accepts unicode, app returns mismatch
