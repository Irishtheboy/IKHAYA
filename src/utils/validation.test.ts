import * as fc from 'fast-check';
import { isValidEmail, isValidPassword, isNonEmptyString } from './validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.za')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    // Property-based test: valid emails should contain @ and .
    it('property: valid emails must contain @ and a domain', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          const result = isValidEmail(email);
          expect(!result || (email.includes('@') && email.split('@')[1].includes('.'))).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidPassword', () => {
    it('should accept valid passwords', () => {
      expect(isValidPassword('Password1')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
      expect(isValidPassword('Abcdefg1')).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      expect(isValidPassword('Pass1')).toBe(false);
      expect(isValidPassword('Abc123')).toBe(false);
    });

    it('should reject passwords without uppercase', () => {
      expect(isValidPassword('password1')).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      expect(isValidPassword('PASSWORD1')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(isValidPassword('Password')).toBe(false);
    });

    // Property-based test: password validation requirements
    it('property: valid passwords must meet all requirements', () => {
      const validPasswordGenerator = fc
        .tuple(
          fc.stringMatching(/^[A-Z]+$/),
          fc.stringMatching(/^[a-z]+$/),
          fc.stringMatching(/^[0-9]+$/),
          fc.string({ minLength: 5 })
        )
        .map(([upper, lower, digit, rest]) => {
          // Ensure minimum lengths
          const upperPart = upper.length > 0 ? upper : 'A';
          const lowerPart = lower.length > 0 ? lower : 'a';
          const digitPart = digit.length > 0 ? digit : '1';

          const chars = (upperPart + lowerPart + digitPart + rest).split('');
          // Shuffle the characters
          for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
          }
          return chars.join('');
        });

      fc.assert(
        fc.property(validPasswordGenerator, (password) => {
          expect(isValidPassword(password)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('a')).toBe(true);
      expect(isNonEmptyString(' text ')).toBe(true);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });

    // Property-based test: non-empty strings should have content after trimming
    it('property: valid strings must have non-zero length after trimming', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (str) => {
          const result = isNonEmptyString(str);
          expect(result).toBe(str.trim().length > 0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
