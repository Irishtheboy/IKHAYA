import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Navigation Links */}
            <div className="flex items-center space-x-8">
              <Link
                to="/search"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
              >
                Properties
              </Link>
              {currentUser && userProfile?.role === 'landlord' && (
                <>
                  <Link
                    to="/properties/manage"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                  >
                    Manage
                  </Link>
                  <Link
                    to="/leads"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                  >
                    Leads
                  </Link>
                </>
              )}
              {currentUser && (
                <>
                  <Link
                    to="/leases"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                  >
                    Leases
                  </Link>
                  <Link
                    to="/maintenance"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                  >
                    Maintenance
                  </Link>
                </>
              )}
              {!currentUser && (
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                >
                  Login
                </Link>
              )}
              {currentUser ? (
                <>
                  <NotificationDropdown />

                  {/* User Profile Section */}
                  <div className="flex items-center space-x-3">
                    {userProfile?.profileImage ? (
                      <img
                        src={userProfile.profileImage}
                        alt={userProfile.name}
                        className="h-8 w-8 rounded-full object-cover border-2 border-cyan-500"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center border-2 border-cyan-500">
                        <svg
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="text-gray-300 text-sm font-light">
                      {userProfile?.name || userProfile?.email}
                    </span>
                  </div>

                  <Link
                    to="/profile/settings"
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="bg-cyan-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-cyan-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white px-3 py-2 text-sm font-light tracking-wide transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/register"
                  className="bg-cyan-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-cyan-600 transition-colors"
                >
                  Contact
                </Link>
              )}
            </div>

            {/* Right side - Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/website-removebg-preview.png"
                alt="IKHAYA Properties"
                className="h-16 w-auto"
              />
            </Link>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-slate-800"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/search"
                className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
              >
                Properties
              </Link>
              {currentUser && userProfile?.role === 'landlord' && (
                <>
                  <Link
                    to="/properties/manage"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Manage
                  </Link>
                  <Link
                    to="/leads"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Leads
                  </Link>
                </>
              )}
              {currentUser && (
                <>
                  <Link
                    to="/leases"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Leases
                  </Link>
                  <Link
                    to="/maintenance"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Maintenance
                  </Link>
                  <Link
                    to="/profile/settings"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Dashboard
                  </Link>
                  <div className="px-3 py-2 text-sm text-gray-400 border-t border-gray-700 mt-2 pt-2">
                    {userProfile?.email}
                  </div>
                </>
              )}
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-light text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Contact
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-wide">IKHAYA PROPERTIES</h3>
              <p className="text-gray-400 font-light">
                Your trusted platform for property rentals in South Africa.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-wide">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/search"
                    className="text-gray-400 hover:text-white font-light transition-colors"
                  >
                    Search Properties
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-gray-400 hover:text-white font-light transition-colors"
                  >
                    List Your Property
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-gray-400 hover:text-white font-light transition-colors"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-wide">Contact</h3>
              <p className="text-gray-400 font-light">Email: info@ikhayarent.co.za</p>
              <p className="text-gray-400 font-light">Phone: +27 11 123 4567</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 font-light">
            <p>&copy; 2026 IKHAYA PROPERTIES. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
