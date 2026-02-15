# Testing Guide

This project uses a dual testing approach with both unit tests and property-based tests.

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: For testing React components
- **fast-check**: Property-based testing library

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- validation.test.ts
```

## Test Structure

### Unit Tests
Unit tests verify specific examples and edge cases:

```typescript
it('should accept valid email addresses', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});
```

### Property-Based Tests
Property-based tests verify universal properties across many generated inputs:

```typescript
it('property: valid emails must contain @ and a domain', () => {
  fc.assert(
    fc.property(fc.emailAddress(), (email) => {
      const result = isValidEmail(email);
      if (result) {
        expect(email).toContain('@');
      }
    }),
    { numRuns: 100 }
  );
});
```

## Writing Tests

### Test File Naming
- Unit tests: `*.test.ts` or `*.test.tsx`
- Place tests next to the code they test

### Property-Based Test Guidelines
1. Run minimum 100 iterations (`numRuns: 100`)
2. Use appropriate generators from fast-check
3. Test universal properties, not specific examples
4. Include a comment referencing the design property number

### Example Property Test

```typescript
// Feature: ikhaya-rent-properties, Property 3: Password validation enforces requirements
it('property: valid passwords must meet all requirements', () => {
  fc.assert(
    fc.property(validPasswordGenerator, (password) => {
      expect(isValidPassword(password)).toBe(true);
    }),
    { numRuns: 100 }
  );
});
```

## Coverage Requirements

- Minimum 70% coverage for branches, functions, lines, and statements
- Run `npm test -- --coverage` to check coverage

## Firebase Emulators for Testing

When testing Firebase functionality, use the Firebase Emulators:

```bash
# Start emulators
npm run emulators

# In another terminal, run tests with emulator flag
REACT_APP_USE_FIREBASE_EMULATORS=true npm test
```

## Continuous Integration

All tests run automatically on every commit. Pull requests must pass all tests before merging.
