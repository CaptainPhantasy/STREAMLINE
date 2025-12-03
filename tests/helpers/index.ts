/**
 * Test Helpers - Main Export
 *
 * Re-exports all test utilities for convenient imports.
 */

// Environment validation
export {
  EnvironmentValidator,
  requireValidEnvironment,
  TEST_USERS,
  TEST_ACCOUNT_SLUG,
  type EnvironmentStatus,
  type TestUser,
} from '../setup/environment-validator'

// Database verification
export {
  DatabaseVerifier,
  getDbVerifier,
  dbAssert,
  type VerificationResult,
  type JobRecord,
  type ContactRecord,
  type UserRecord,
  type ConversationRecord,
} from './database-verifier'

// API client
export {
  ApiClient,
  ApiTestRunner,
  getApiClient,
  crmApiTests,
  type ApiResponse,
  type ApiTestResult,
} from './api-client'

// UI test base
export {
  UITestBase,
  SmartLocator,
  TestError,
  TestFailureType,
  createTestFixture,
  globalTestSetup,
  pageObjects,
} from './ui-test-base'

// Test password constant for all users
export { TEST_PASSWORD } from '../setup/environment-validator'
