/**
 * Test helpers for Cloud Functions
 * These utilities help with testing functions locally
 */

/**
 * Mock user data for testing
 */
export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  role: "landlord" | "tenant" | "admin";
}

/**
 * Create a mock Firebase Auth user
 */
export function createMockAuthUser(
  data: Partial<MockUser> = {}
): Record<string, unknown> {
  return {
    uid: data.uid || "test-user-123",
    email: data.email || "test@example.com",
    displayName: data.displayName || "Test User",
    emailVerified: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    toJSON: () => ({}),
  };
}

/**
 * Create mock Firestore user document data
 */
export function createMockUserDoc(
  data: Partial<MockUser> = {}
): Record<string, unknown> {
  return {
    uid: data.uid || "test-user-123",
    email: data.email || "test@example.com",
    name: data.displayName || "Test User",
    role: data.role || "tenant",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
