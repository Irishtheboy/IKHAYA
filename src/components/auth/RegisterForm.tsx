import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, RegisterDTO } from '../../services/authService';
import { UserRole } from '../../types/firebase';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  phone?: string;
  general?: string;
}

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Phone validation (optional but validate format if provided)
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registerData: RegisterDTO = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role as UserRole,
        phone: formData.phone.trim() || undefined,
      };

      await authService.register(registerData);

      setSuccessMessage('Registration successful! Please check your email to verify your account.');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-light">
          {successMessage}
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-light">
          {errors.general}
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-light text-slate-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`block w-full px-4 py-3 border ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-light`}
          disabled={isLoading}
          placeholder="John Doe"
        />
        {errors.name && <p className="mt-2 text-sm text-red-600 font-light">{errors.name}</p>}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-light text-slate-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`block w-full px-4 py-3 border ${
            errors.email ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-light`}
          disabled={isLoading}
          placeholder="your@email.com"
        />
        {errors.email && <p className="mt-2 text-sm text-red-600 font-light">{errors.email}</p>}
      </div>

      {/* Role Selection */}
      <div>
        <label htmlFor="role" className="block text-sm font-light text-slate-700 mb-2">
          I am a
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={`block w-full px-4 py-3 border ${
            errors.role ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-light`}
          disabled={isLoading}
        >
          <option value="">Select your role</option>
          <option value="tenant">Tenant (I'm looking for a property)</option>
        </select>
        {errors.role && <p className="mt-2 text-sm text-red-600 font-light">{errors.role}</p>}

        {/* Info Notice */}
        <div className="mt-3 bg-cyan-50 border border-cyan-200 rounded-lg p-3">
          <p className="text-sm text-cyan-900 font-light">
            <span className="font-medium">Are you a landlord?</span> Landlord accounts are created
            by our admin team. Contact us at info@ikhayarent.co.za
          </p>
        </div>
      </div>

      {/* Phone Field (Optional) */}
      <div>
        <label htmlFor="phone" className="block text-sm font-light text-slate-700 mb-2">
          Phone Number <span className="text-slate-400">(Optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+27 12 345 6789"
          className={`block w-full px-4 py-3 border ${
            errors.phone ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-light`}
          disabled={isLoading}
        />
        {errors.phone && <p className="mt-2 text-sm text-red-600 font-light">{errors.phone}</p>}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-light text-slate-700 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`block w-full px-4 py-3 border ${
            errors.password ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-light`}
          disabled={isLoading}
          placeholder="Create a strong password"
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-600 font-light">{errors.password}</p>
        )}
        <p className="mt-2 text-xs text-slate-500 font-light">
          At least 8 characters with uppercase, lowercase, and number
        </p>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-light text-slate-700 mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`block w-full px-4 py-3 border ${
            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-light`}
          disabled={isLoading}
          placeholder="Re-enter your password"
        />
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 font-light">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
          isLoading
            ? 'bg-cyan-400 cursor-not-allowed'
            : 'bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating Account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
