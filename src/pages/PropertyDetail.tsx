import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { propertyService } from '../services/propertyService';
import { authService } from '../services/authService';
import { Property, User } from '../types/firebase';
import {
  updateMetaTags,
  generatePropertySchema,
  addStructuredData,
  cleanupSEO,
} from '../utils/seo';
import { useAuth } from '../contexts/AuthContext';

const PropertyDetail: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlord, setLandlord] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showContactNumber, setShowContactNumber] = useState(false);

  useEffect(() => {
    loadProperty();

    // Cleanup SEO elements when component unmounts
    return () => {
      cleanupSEO();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    // Update SEO meta tags and structured data when property loads
    if (property && propertyId) {
      updateMetaTags(property, propertyId);
      const schema = generatePropertySchema(property, propertyId);
      addStructuredData(schema);
    }
  }, [property, propertyId]);

  const loadProperty = async () => {
    if (!propertyId) {
      setError('Property ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await propertyService.getProperty(propertyId);

      if (!data) {
        setError('Property not found');
      } else {
        setProperty(data);
        
        // Fetch landlord information
        try {
          console.log('Fetching landlord info for ID:', data.landlordId);
          const landlordData = await authService.getUserProfile(data.landlordId);
          console.log('Landlord data received:', landlordData);
          if (landlordData) {
            setLandlord(landlordData);
          }
        } catch (landlordError) {
          console.error('Error fetching landlord info:', landlordError);
          // Don't fail the whole page if landlord info can't be loaded
          // Property will still display, just without landlord details
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load property');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpressInterest = () => {
    if (!currentUser) {
      setShowAuthPrompt(true);
    } else {
      // Navigate to lead creation form
      navigate(`/leads/create?propertyId=${propertyId}`);
    }
  };

  const handleContactLandlord = () => {
    if (!currentUser) {
      setShowAuthPrompt(true);
    } else {
      // Toggle showing contact number
      setShowContactNumber(!showContactNumber);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-light text-slate-900 mb-3 tracking-tight">Property Not Found</h2>
            <p className="text-slate-600 font-light mb-8">
              {error || 'This property is no longer available'}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-light tracking-wide transition-colors"
            >
              BACK TO SEARCH
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-slate-600 hover:text-slate-900 font-light transition-colors"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          BACK
        </button>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
          {/* Image Gallery */}
          <div className="relative">
            {property.images && property.images.length > 0 ? (
              <>
                <div className="h-96 bg-gray-200">
                  <img
                    src={property.images[selectedImageIndex]}
                    alt={property.address}
                    className="w-full h-full object-cover"
                  />
                </div>
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {property.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {property.images.length > 1 && (
                  <div className="absolute top-1/2 left-4 right-4 flex justify-between transform -translate-y-1/2">
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? property.images!.length - 1 : prev - 1
                        )
                      }
                      className="bg-white/80 hover:bg-white p-2 rounded-full"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === property.images!.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="bg-white/80 hover:bg-white p-2 rounded-full"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                <svg
                  className="h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
            )}
            {property.isPremium && (
              <span className="absolute top-4 right-4 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg text-sm font-light tracking-wide border border-amber-200">
                PREMIUM
              </span>
            )}
          </div>

          {/* Property Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-light text-slate-900 mb-2 tracking-tight">
                  {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                </h1>
                <p className="text-lg text-slate-600 mb-2 font-light">{property.address}</p>
                <p className="text-slate-500 mb-8 font-light">
                  {property.city}, {property.province}
                  {property.postalCode && `, ${property.postalCode}`}
                </p>

                {/* Key Features */}
                <div className="flex items-center gap-8 mb-8 pb-8 border-b border-slate-200">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-slate-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="text-slate-700 font-light">{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-slate-400 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-slate-700 font-light">{property.bathrooms} Bathrooms</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-light text-slate-900 mb-4 tracking-tight">DESCRIPTION</h2>
                  <p className="text-slate-600 font-light leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>

                {/* Property Overview */}
                <div className="mb-8">
                  <h2 className="text-xl font-light text-slate-900 mb-4 tracking-tight">PROPERTY DETAILS</h2>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-light text-slate-500">Listing Number</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-light">{property.id.slice(0, 8).toUpperCase()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-light text-slate-500">Property Type</dt>
                        <dd className="mt-1 text-sm text-slate-900 capitalize font-light">{property.propertyType}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-light text-slate-500">Bedrooms</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-light">{property.bedrooms}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-light text-slate-500">Bathrooms</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-light">{property.bathrooms}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-light text-slate-500">Available From</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-light">
                          {formatDate(property.availableFrom)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-light text-slate-500">Deposit Required</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-light">
                          {formatCurrency(property.deposit)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* External Features */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-light text-slate-900 mb-4 tracking-tight">FEATURES</h2>
                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {property.amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center">
                            <svg
                              className="h-4 w-4 text-slate-400 mr-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-slate-700 capitalize font-light">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Education */}
                <div className="mb-8">
                  <h2 className="text-xl font-light text-slate-900 mb-4 tracking-tight">NEARBY SCHOOLS</h2>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-light">Siyabonga S</span>
                        <span className="text-sm text-slate-500 font-light">1.66km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-light">Dixon Heights Primary School</span>
                        <span className="text-sm text-slate-500 font-light">2.08km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Food And Entertainment */}
                <div className="mb-8">
                  <h2 className="text-xl font-light text-slate-900 mb-4 tracking-tight">NEARBY AMENITIES</h2>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-light">KFC - Winterspruit</span>
                        <span className="text-sm text-slate-500 font-light">3.04km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transport And Public Services */}
                <div className="mb-8">
                  <h2 className="text-xl font-light text-slate-900 mb-4 tracking-tight">TRANSPORT</h2>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-light">Wozani Beach</span>
                        <span className="text-sm text-slate-500 font-light">2.78km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700 font-light">Doonside</span>
                        <span className="text-sm text-slate-500 font-light">3.06km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info - Removed duplicate, already in Property Details */}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-slate-50 rounded-lg p-6 sticky top-4 border border-slate-200">
                  <div className="mb-6">
                    <p className="text-3xl font-light text-slate-900 mb-1">
                      {formatCurrency(property.rentAmount)}
                    </p>
                    <p className="text-slate-500 font-light">per month</p>
                  </div>

                  <button
                    onClick={handleExpressInterest}
                    className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 font-light tracking-wide mb-3 transition-colors"
                  >
                    CONTACT AGENT
                  </button>

                  <button
                    onClick={handleContactLandlord}
                    className="w-full flex items-center justify-center border border-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-100 font-light mb-6 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {showContactNumber && landlord?.phone ? landlord.phone : 'SHOW NUMBER'}
                  </button>

                  {/* Contact Form */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-light text-slate-900 mb-4 tracking-wide">ENQUIRE ABOUT THIS PROPERTY</h3>
                    <form className="space-y-4">
                      <div>
                        <input
                          type="text"
                          placeholder="Name"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Email"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-light"
                        />
                      </div>
                      <div>
                        <textarea
                          rows={4}
                          placeholder="Message"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none font-light"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 font-light tracking-wide transition-colors"
                      >
                        SEND ENQUIRY
                      </button>
                      <p className="text-xs text-slate-500 text-center font-light">
                        By submitting this form you agree to our{' '}
                        <a href="#" className="text-slate-700 hover:underline">Terms & Conditions</a>
                      </p>
                    </form>
                  </div>

                  {/* Social Share - Simplified */}
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <p className="text-xs text-slate-500 text-center font-light mb-3">SHARE THIS PROPERTY</p>
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>
                      <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </button>
                      <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="border-t pt-6 mt-6">
                    <button className="w-full flex items-center justify-center text-gray-700 hover:text-gray-900 font-medium">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </button>
                  </div>

                  {/* Agency Info */}
                  <div className="border-t pt-6 mt-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-cyan-600 mb-2">Agency</h3>
                      <div className="bg-cyan-500 text-white py-4 px-6 rounded-lg">
                        <div className="text-xl font-bold">IKHAYA</div>
                        <div className="text-sm">REAL ESTATE</div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="border-t pt-6 mt-6">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-cyan-600 mb-4">Agent</h3>
                      <div className="mb-4">
                        {landlord?.profileImage ? (
                          <img
                            src={landlord.profileImage}
                            alt={landlord.name}
                            className="w-32 h-32 rounded-lg mx-auto mb-3 object-cover"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-lg mx-auto mb-3 bg-gray-200 flex items-center justify-center">
                            <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                        <p className="font-medium text-gray-900">{landlord?.name || 'Property Owner'}</p>
                        {landlord?.email && (
                          <p className="text-sm text-gray-500 mt-1">{landlord.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/search?landlordId=${property?.landlordId}`)}
                        className="text-cyan-600 hover:text-cyan-700 font-medium mb-4"
                      >
                        View Agent's Properties
                      </button>
                      <button
                        onClick={() => setShowContactNumber(!showContactNumber)}
                        className="w-full flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-100 font-medium transition-colors"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {showContactNumber && landlord?.phone ? landlord.phone : 'Show Contact Number'}
                      </button>
                    </div>
                  </div>

                  {!currentUser && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-gray-500 text-center">
                        Sign in or create an account to contact the landlord
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Sign In Required</h3>
                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-gray-600 mb-6">
                  To express interest in this property or contact the landlord, you need to sign in
                  or create an account.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() =>
                      navigate('/login', { state: { from: window.location.pathname } })
                    }
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() =>
                      navigate('/register', { state: { from: window.location.pathname } })
                    }
                    className="w-full border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 font-medium"
                  >
                    Create Account
                  </button>

                  <button
                    onClick={() => setShowAuthPrompt(false)}
                    className="w-full text-gray-600 px-6 py-3 rounded-md hover:bg-gray-100 font-medium"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertyDetail;
