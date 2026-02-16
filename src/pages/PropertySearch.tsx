import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { propertyService, SearchCriteria } from '../services/propertyService';
import { Property } from '../types/firebase';
import { generatePropertyUrl } from '../utils/seo';
import {
  Card,
  Button,
  Badge,
  SearchIcon,
  FilterIcon,
  PropertyIcon,
  LocationIcon,
  MoneyIcon,
  RatingIcon,
} from '../components/common';

const PropertySearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: searchParams.get('location') || '',
    minPrice: undefined,
    maxPrice: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    propertyType: undefined,
    sortBy: 'date',
  });

  const handleSearch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const criteria: SearchCriteria = {};
      if (searchCriteria.location) criteria.location = searchCriteria.location;
      if (searchCriteria.minPrice) criteria.minPrice = searchCriteria.minPrice;
      if (searchCriteria.maxPrice) criteria.maxPrice = searchCriteria.maxPrice;
      if (searchCriteria.bedrooms) criteria.bedrooms = searchCriteria.bedrooms;
      if (searchCriteria.bathrooms) criteria.bathrooms = searchCriteria.bathrooms;
      if (searchCriteria.propertyType) criteria.propertyType = searchCriteria.propertyType;
      if (searchCriteria.sortBy) criteria.sortBy = searchCriteria.sortBy;

      const result = await propertyService.searchProperties(criteria);
      setProperties(result.properties);
    } catch (err: any) {
      setError(err.message || 'Failed to search properties');
    } finally {
      setIsLoading(false);
    }
  }, [searchCriteria]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchCriteria((prev) => ({
      ...prev,
      [name]:
        name === 'minPrice' || name === 'maxPrice' || name === 'bedrooms' || name === 'bathrooms'
          ? value
            ? Number(value)
            : undefined
          : value || undefined,
    }));
  };

  const handleReset = () => {
    setSearchCriteria({
      location: '',
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyType: undefined,
      sortBy: 'date',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      {/* Hero Section with Background */}
      <div className="relative min-h-[400px] overflow-hidden">
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

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-6 tracking-tight">
              FIND YOUR PERFECT HOME
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 font-light max-w-3xl mx-auto">
              Discover quality rental properties across South Africa
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters */}
        <Card className="mb-8 -mt-16 relative z-10 bg-white/95 backdrop-blur-sm" shadow="xl">
          <div className="flex items-center mb-6">
            <FilterIcon className="text-slate-600 mr-3" size="lg" />
            <h2 className="text-xl font-light text-slate-900 tracking-tight">Search Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label htmlFor="location" className="block text-sm font-light text-slate-700 mb-2">
                <LocationIcon size="sm" className="inline mr-1" />
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={searchCriteria.location || ''}
                onChange={handleInputChange}
                placeholder="City or Province"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="propertyType"
                className="block text-sm font-light text-slate-700 mb-2"
              >
                <PropertyIcon size="sm" className="inline mr-1" />
                Property Type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={searchCriteria.propertyType || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="room">Room</option>
              </select>
            </div>

            <div>
              <label htmlFor="bedrooms" className="block text-sm font-light text-slate-700 mb-2">
                Min Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                min="0"
                value={searchCriteria.bedrooms || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              />
            </div>

            <div>
              <label htmlFor="bathrooms" className="block text-sm font-light text-slate-700 mb-2">
                Min Bathrooms
              </label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                min="0"
                step="0.5"
                value={searchCriteria.bathrooms || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              />
            </div>

            <div>
              <label htmlFor="minPrice" className="block text-sm font-light text-slate-700 mb-2">
                <MoneyIcon size="sm" className="inline mr-1" />
                Min Price (R)
              </label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                min="0"
                value={searchCriteria.minPrice || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-sm font-light text-slate-700 mb-2">
                Max Price (R)
              </label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                min="0"
                value={searchCriteria.maxPrice || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="sortBy" className="block text-sm font-light text-slate-700 mb-2">
                Sort By
              </label>
              <select
                id="sortBy"
                name="sortBy"
                value={searchCriteria.sortBy || 'date'}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-light transition-all"
              >
                <option value="date">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              loading={isLoading}
              leftIcon={SearchIcon}
              size="lg"
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-medium"
            >
              Search Properties
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg" className="sm:w-auto font-light">
              Reset Filters
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50/50 backdrop-blur-sm">
            <div className="text-red-800 font-light">{error}</div>
          </Card>
        )}

        {/* Results Header */}
        {!isLoading && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-slate-600 font-light text-lg">
              Found {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-slate-600 font-light">Searching properties...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && properties.length === 0 && (
          <Card className="text-center py-16 bg-white/95 backdrop-blur-sm">
            <SearchIcon size="xl" className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-light text-slate-900 mb-2 tracking-tight">No properties found</h3>
            <p className="text-slate-600 font-light mb-6">
              Try adjusting your search criteria to find more results.
            </p>
            <Button onClick={handleReset} variant="outline" className="font-light">
              Reset Search
            </Button>
          </Card>
        )}

        {/* Property Results */}
        {!isLoading && properties.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="group overflow-hidden" hover>
                <Link to={generatePropertyUrl(property.id, property)} className="block">
                  {/* Property Image */}
                  <div className="h-56 bg-gray-200 relative overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.address}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <PropertyIcon size="xl" className="text-gray-400" />
                      </div>
                    )}

                    {/* Premium Badge */}
                    {property.isPremium && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="warning" size="sm" icon={RatingIcon}>
                          Premium
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-light text-slate-900 group-hover:text-cyan-600 transition-colors tracking-tight">
                        {property.propertyType.charAt(0).toUpperCase() +
                          property.propertyType.slice(1)}
                      </h3>
                    </div>

                    <div className="flex items-start mb-4">
                      <LocationIcon size="sm" className="text-slate-400 mt-1 mr-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-600 truncate font-light">{property.address}</p>
                        <p className="text-slate-500 text-sm font-light">
                          {property.city}, {property.province}
                        </p>
                      </div>
                    </div>

                    {/* Property Features */}
                    <div className="flex items-center space-x-6 text-slate-600 mb-4">
                      <span className="flex items-center text-sm font-light">
                        <PropertyIcon size="xs" className="mr-1" />
                        {property.bedrooms} bed
                      </span>
                      <span className="flex items-center text-sm font-light">
                        <svg
                          className="h-3 w-3 mr-1"
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
                        {property.bathrooms} bath
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MoneyIcon size="sm" className="text-cyan-600 mr-2" />
                        <span className="text-2xl font-light text-cyan-600">
                          {formatCurrency(property.rentAmount)}
                        </span>
                        <span className="text-slate-500 ml-1 font-light">/mo</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertySearch;
