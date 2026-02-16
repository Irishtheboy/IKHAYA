import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/hero-background.jpg"
          alt="IKHAYA Properties"
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-900/80"></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img 
                src="/website-removebg-preview.png" 
                alt="IKHAYA Properties" 
                className="h-48 w-auto mx-auto"
              />
            </Link>
            <div className="w-16 h-px bg-white/30 mx-auto mt-4"></div>
          </div>

          {/* Register Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-tight">
                Create Account
              </h2>
              <p className="mt-3 text-sm text-slate-600 font-light">
                Join IKHAYA Properties today
              </p>
            </div>

            <RegisterForm />

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-slate-600 font-light">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-cyan-600 hover:text-cyan-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-white/70 hover:text-white font-light transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
