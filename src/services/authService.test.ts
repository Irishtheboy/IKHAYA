import { authService, RegisterDTO, LoginDTO } from './authService';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user with valid data', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'tenant',
        phone: '+27123456789',
      };

      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: mockUserData.email,
        emailVerified: false,
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.register(mockUserData);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        mockUserData.email,
        mockUserData.password
      );
      expect(updateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName: mockUserData.name,
      });
      expect(setDoc).toHaveBeenCalled();
      expect(sendEmailVerification).toHaveBeenCalledWith(mockFirebaseUser);
      expect(result.user.email).toBe(mockUserData.email);
      expect(result.user.name).toBe(mockUserData.name);
      expect(result.user.role).toBe(mockUserData.role);
    });

    it('should throw error for duplicate email', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'Password123',
        role: 'landlord',
      };

      const error: any = new Error('Email already in use');
      error.code = 'auth/email-already-in-use';

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(authService.register(mockUserData)).rejects.toThrow(
        'An account with this email already exists'
      );
    });

    it('should throw error for weak password', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        role: 'tenant',
      };

      await expect(authService.register(mockUserData)).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should throw error for password without uppercase', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'tenant',
      };

      await expect(authService.register(mockUserData)).rejects.toThrow(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should throw error for password without lowercase', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'PASSWORD123',
        role: 'tenant',
      };

      await expect(authService.register(mockUserData)).rejects.toThrow(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should throw error for password without number', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password',
        role: 'tenant',
      };

      await expect(authService.register(mockUserData)).rejects.toThrow(
        'Password must contain at least one number'
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockCredentials: LoginDTO = {
        email: 'john@example.com',
        password: 'Password123',
      };

      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: mockCredentials.email,
        emailVerified: true,
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      const mockUserDoc = {
        exists: () => true,
        id: 'test-uid-123',
        data: () => ({
          uid: 'test-uid-123',
          email: mockCredentials.email,
          name: 'John Doe',
          role: 'tenant',
          emailVerified: true,
          createdAt: { seconds: 1234567890 },
          updatedAt: { seconds: 1234567890 },
        }),
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

      const result = await authService.login(mockCredentials);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        mockCredentials.email,
        mockCredentials.password
      );
      expect(getDoc).toHaveBeenCalled();
      expect(result.user.email).toBe(mockCredentials.email);
      expect(result.firebaseUser).toBe(mockFirebaseUser);
    });

    it('should throw error for invalid credentials', async () => {
      const mockCredentials: LoginDTO = {
        email: 'john@example.com',
        password: 'WrongPassword123',
      };

      const error: any = new Error('Invalid credentials');
      error.code = 'auth/invalid-credential';

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for disabled account', async () => {
      const mockCredentials: LoginDTO = {
        email: 'disabled@example.com',
        password: 'Password123',
      };

      const error: any = new Error('User disabled');
      error.code = 'auth/user-disabled';

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(authService.login(mockCredentials)).rejects.toThrow(
        'This account has been disabled'
      );
    });

    it('should throw error when user profile not found', async () => {
      const mockCredentials: LoginDTO = {
        email: 'john@example.com',
        password: 'Password123',
      };

      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: mockCredentials.email,
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      const mockUserDoc = {
        exists: () => false,
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

      await expect(authService.login(mockCredentials)).rejects.toThrow('User profile not found');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should throw error if logout fails', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout()).rejects.toThrow('Failed to logout');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
      const email = 'john@example.com';

      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await authService.requestPasswordReset(email);

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, email);
    });

    it('should not reveal if email does not exist', async () => {
      const email = 'nonexistent@example.com';

      const error: any = new Error('User not found');
      error.code = 'auth/user-not-found';

      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(error);

      // Should not throw error for security reasons
      await expect(authService.requestPasswordReset(email)).resolves.toBeUndefined();
    });

    it('should throw error for invalid email', async () => {
      const email = 'invalid-email';

      const error: any = new Error('Invalid email');
      error.code = 'auth/invalid-email';

      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(error);

      await expect(authService.requestPasswordReset(email)).rejects.toThrow(
        'Invalid email address'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'john@example.com',
      };

      (auth as any).currentUser = mockUser;

      const result = authService.getCurrentUser();

      expect(result).toBe(mockUser);
    });

    it('should return null when no user is logged in', () => {
      (auth as any).currentUser = null;

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile from Firestore', async () => {
      const uid = 'test-uid-123';

      const mockUserDoc = {
        exists: () => true,
        id: uid,
        data: () => ({
          uid,
          email: 'john@example.com',
          name: 'John Doe',
          role: 'tenant',
          emailVerified: true,
          createdAt: { seconds: 1234567890 },
          updatedAt: { seconds: 1234567890 },
        }),
      };

      (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

      const result = await authService.getUserProfile(uid);

      expect(getDoc).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.email).toBe('john@example.com');
      expect(result?.name).toBe('John Doe');
    });

    it('should return null when user profile not found', async () => {
      const uid = 'nonexistent-uid';

      const mockUserDoc = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

      const result = await authService.getUserProfile(uid);

      expect(result).toBeNull();
    });
  });

  describe('resendEmailVerification', () => {
    it('should resend verification email to current user', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'john@example.com',
        emailVerified: false,
      };

      (auth as any).currentUser = mockUser;
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      await authService.resendEmailVerification();

      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when no user is logged in', async () => {
      (auth as any).currentUser = null;

      await expect(authService.resendEmailVerification()).rejects.toThrow(
        'No user is currently logged in'
      );
    });

    it('should throw error when email is already verified', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'john@example.com',
        emailVerified: true,
      };

      (auth as any).currentUser = mockUser;

      await expect(authService.resendEmailVerification()).rejects.toThrow(
        'Email is already verified'
      );
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', async () => {
      const mockUserData: RegisterDTO = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        role: 'tenant',
      };

      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: mockUserData.email,
        emailVerified: false,
      };

      const mockUserCredential = {
        user: mockFirebaseUser,
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      // Should not throw error
      await expect(authService.register(mockUserData)).resolves.toBeDefined();
    });
  });
});
