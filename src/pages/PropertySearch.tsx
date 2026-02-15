import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { propertyService, SearchCriteria } from '../services/propertyService';
import { Property } from '../types/firebase';
import { generatePropertyUrl } from '../utils/seo';

const PropertySearch: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: '',
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Find Your Perfect Home
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100">
            Search from thousands of available properties
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Search Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={searchCriteria.location || ''}
                onChange={handleInputChange}
                placeholder="City or Province"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            <div>
              <label
                htmlFor="propertyType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Property Type
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={searchCriteria.propertyType || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="room">Room</option>
              </select>
            </div>

            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Min Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                min="0"
                value={searchCriteria.bedrooms || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (R)
              </label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                min="0"
                value={searchCriteria.minPrice || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (R)
              </label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                min="0"
                value={searchCriteria.maxPrice || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                name="sortBy"
                value={searchCriteria.sortBy || 'date'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
              >
                <option value="date">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="relevance">Most Relevant</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition text-base font-medium"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition text-base font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!isLoading && (
          <div className="mb-4 text-gray-600 font-medium">
            Found {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {!isLoading && properties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria to find more results.
            </p>
          </div>
        )}

        {!isLoading && properties.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.id}
                to={generatePropertyUrl(property.id, property)}
                className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="h-16 w-16 text-gray-400"
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
                    <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
                      Premium
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 truncate">{property.address}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {property.city}, {property.province}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>{property.bedrooms} bed</span>
                    <span>•</span>
                    <span>{property.bathrooms} bath</span>
                  </div>

                  <p className="text-xl font-bold text-indigo-600">
                    {formatCurrency(property.rentAmount)}/mo
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertySearch;
