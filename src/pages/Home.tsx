import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button, Card } from '../components/common';
import { SearchIcon, PropertyIcon, UserIcon, CheckmarkIcon } from '../components/common';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  // South African cities and popular areas
  const locations = [
    'Cape Town',
    'Johannesburg',
    'Durban',
    'Pretoria',
    'Port Elizabeth',
    'Bloemfontein',
    'East London',
    'Polokwane',
    'Nelspruit',
    'Kimberley',
    'Sandton',
    'Rosebank',
    'Centurion',
    'Midrand',
    'Randburg',
    'Roodepoort',
    'Soweto',
    'Umhlanga',
    'Ballito',
    'Pietermaritzburg',
    'Stellenbosch',
    'Paarl',
    'Somerset West',
    'Bellville',
    'Constantia',
    'Sea Point',
    'Green Point',
    'Camps Bay',
    'Claremont',
    'Rondebosch',
  ];

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0) {
      const filtered = locations.filter((location) =>
        location.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (location: string) => {
    setSearchQuery(location);
    setShowSuggestions(false);
    navigate(`/search?location=${encodeURIComponent(location)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/search?location=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/hero-background.jpg"
            alt="Colorful houses representing IKHAYA Properties"
            className="w-full h-full object-cover"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
              PREMIUM PROPERTY MANAGEMENT
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-6 tracking-tight drop-shadow-lg">
              LUXURY
              <span className="block font-extralight text-white/90">PROPERTY AGENTS</span>
            </h1>

            {/* Subtitle */}
            <div className="max-w-2xl mx-auto mb-12">
              <p className="text-xl text-white font-light leading-relaxed mb-2 drop-shadow-md">
                IKHAYA PROPERTIES | SOUTH AFRICA
              </p>
              <p className="text-lg text-white/90 font-light drop-shadow-md">
                Discover exceptional rental properties with unparalleled service and expertise
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Button
                as={Link}
                to="/search"
                variant="outline"
                size="lg"
                className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30 px-8 py-4 text-lg font-light tracking-wide shadow-lg"
              >
                OUR PROPERTIES
              </Button>
              <Button
                as={Link}
                to="/register"
                variant="ghost"
                size="lg"
                className="text-white hover:text-white px-8 py-4 text-lg font-light tracking-wide border border-white/30 hover:border-white/50 hover:bg-white/10 shadow-lg"
                rightIcon={SearchIcon}
              >
                BOOK APPOINTMENT
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row items-center gap-4 p-6"
            >
              <div className="flex-1 w-full relative">
                <input
                  type="text"
                  placeholder="Search by Address or Area"
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full px-4 py-3 text-lg border-0 bg-transparent focus:outline-none placeholder-gray-500 font-light"
                />
                {/* Autocomplete Suggestions */}
                {showSuggestions && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-60 overflow-y-auto">
                    {filteredLocations.map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(location)}
                        className="w-full text-left px-4 py-3 hover:bg-cyan-50 transition-colors font-light text-slate-700 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-3 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {location}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 px-8 py-3 text-white font-light tracking-wide w-full md:w-auto"
                leftIcon={SearchIcon}
              >
                SEARCH
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-4 tracking-tight">
              EXCEPTIONAL SERVICE
            </h2>
            <div className="w-24 h-px bg-slate-300 mx-auto mb-6"></div>
            <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto">
              We provide comprehensive property management solutions tailored to your unique needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-500 border-0 bg-slate-50/50">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-900 transition-colors duration-300">
                  <PropertyIcon className="w-8 h-8 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-light text-slate-900 mb-4 tracking-wide">
                  PROPERTY SEARCH
                </h3>
                <p className="text-slate-600 font-light leading-relaxed">
                  Curated selection of premium properties across South Africa's most desirable
                  locations
                </p>
              </div>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-500 border-0 bg-slate-50/50">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-900 transition-colors duration-300">
                  <UserIcon className="w-8 h-8 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-light text-slate-900 mb-4 tracking-wide">
                  PERSONAL SERVICE
                </h3>
                <p className="text-slate-600 font-light leading-relaxed">
                  Dedicated property consultants providing personalized guidance throughout your
                  journey
                </p>
              </div>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-500 border-0 bg-slate-50/50">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-900 transition-colors duration-300">
                  <CheckmarkIcon className="w-8 h-8 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-light text-slate-900 mb-4 tracking-wide">
                  TRUSTED EXPERTISE
                </h3>
                <p className="text-slate-600 font-light leading-relaxed">
                  Years of experience in luxury property management with verified listings and
                  secure transactions
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-light text-white mb-2">500+</div>
              <div className="text-white/60 font-light tracking-wide">PROPERTIES</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-light text-white mb-2">1000+</div>
              <div className="text-white/60 font-light tracking-wide">HAPPY CLIENTS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-light text-white mb-2">50+</div>
              <div className="text-white/60 font-light tracking-wide">LOCATIONS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-light text-white mb-2">24/7</div>
              <div className="text-white/60 font-light tracking-wide">SUPPORT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-4 tracking-tight">
              OUR PROCESS
            </h2>
            <div className="w-24 h-px bg-slate-300 mx-auto mb-6"></div>
            <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto">
              A seamless journey from initial consultation to finding your perfect home
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'CONSULTATION',
                desc: 'Initial meeting to understand your requirements',
              },
              {
                step: '02',
                title: 'PROPERTY SEARCH',
                desc: 'Curated selection based on your criteria',
              },
              { step: '03', title: 'VIEWING', desc: 'Personalized property tours and inspections' },
              {
                step: '04',
                title: 'COMPLETION',
                desc: 'Seamless lease signing and move-in process',
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-2 border-slate-200 rounded-full flex items-center justify-center mx-auto group-hover:border-slate-900 transition-colors duration-300">
                    <span className="text-2xl font-light text-slate-400 group-hover:text-slate-900 transition-colors duration-300">
                      {item.step}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-slate-200 transform -translate-y-1/2"></div>
                  )}
                </div>
                <h3 className="text-lg font-light text-slate-900 mb-3 tracking-wide">
                  {item.title}
                </h3>
                <p className="text-slate-600 font-light text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-light text-white mb-6 tracking-tight">
            READY TO BEGIN?
          </h2>
          <p className="text-xl text-white/70 font-light mb-12 leading-relaxed">
            Contact our expert team today to discuss your property requirements
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              as={Link}
              to="/register"
              variant="outline"
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-light tracking-wide border-0"
            >
              GET STARTED
            </Button>
            <Button
              as={Link}
              to="/search"
              variant="ghost"
              size="lg"
              className="text-white/80 hover:text-white px-8 py-4 text-lg font-light tracking-wide border border-white/20 hover:border-white/40"
            >
              VIEW PROPERTIES
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
