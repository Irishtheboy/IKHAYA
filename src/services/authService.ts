import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types/firebase';

/**
 * Data Transfer Object for user registration
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

/**
 * Data Transfer Object for user login
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Authentication result containing user data
 */
export interface AuthResult {
  user: User;
  firebaseUser: FirebaseUser;
}

/**
 * Firebase Authentication Service
 * Handles user registration, login, logout, and password management
 */
class AuthService {
  /**
   * Register a new user with email and password
   * Creates Firebase Auth account and user profile in Firestore
   * Sends email verification
   *
   * @param userData - User registration data
   * @returns Promise resolving to the created user
   * @throws Error if registration fails
   */
  async register(userData: RegisterDTO): Promise<AuthResult> {
    try {
      // Validate password requirements
      this.validatePassword(userData.password);

      // Create Firebase Auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const firebaseUser = userCredential.user;

      // Update display name in Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: userData.name,
      });

      // Create user profile in Firestore
      const userProfile: Omit<User, 'id'> = {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        emailVerified: false,
        // Landlords require admin approval before they can use the platform
        approved: userData.role === 'landlord' ? false : true,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      // Save to Firestore using uid as document ID
      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Return user data
      const user: User = {
        id: firebaseUser.uid,
        ...userProfile,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      };

      return {
        user,
        firebaseUser,
      };
    } catch (error: any) {
      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }
      throw error;
    }
  }

  /**
   * Login user with email and password
   *
   * @param credentials - User login credentials
   * @returns Promise resolving to authenticated user
   * @throws Error if login fails
   */
  async login(credentials: LoginDTO): Promise<AuthResult> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      const user: User = {
        id: userDoc.id,
        ...userData,
      };

      return {
        user,
        firebaseUser,
      };
    } catch (error: any) {
      // Handle Firebase Auth errors
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later');
      }
      throw error;
    }
  }

  /**
   * Logout current user
   *
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Failed to logout');
    }
  }

  /**
   * Send password reset email to user
   *
   * @param email - User's email address
   * @returns Promise that resolves when email is sent
   * @throws Error if email sending fails
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if email exists for security
        // Still resolve successfully
        return;
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      throw error;
    }
  }

  /**
   * Get current authenticated user
   *
   * @returns Current Firebase user or null if not authenticated
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Get user profile from Firestore
   *
   * @param uid - User ID
   * @returns Promise resolving to user profile or null if not found
   */
  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      return {
        id: userDoc.id,
        ...userData,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Validate password meets requirements
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   *
   * @param password - Password to validate
   * @throws Error if password doesn't meet requirements
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  /**
   * Resend email verification to current user
   *
   * @returns Promise that resolves when email is sent
   * @throws Error if no user is logged in or email sending fails
   */
  async resendEmailVerification(): Promise<void> {
    const user = this.getCurrentUser();

    if (!user) {
      throw new Error('No user is currently logged in');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    try {
      await sendEmailVerification(user);
    } catch (error) {
      throw new Error('Failed to send verification email');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
