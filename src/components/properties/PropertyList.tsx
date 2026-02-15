import React from 'react';
import { Property, PropertyStatus } from '../../types/firebase';
import { Link } from 'react-router-dom';
import { generatePropertyUrl } from '../../utils/seo';

interface PropertyListProps {
  properties: Property[];
  onStatusChange?: (propertyId: string, status: PropertyStatus) => void;
  onDelete?: (propertyId: string) => void;
  isLoading?: boolean;
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  onStatusChange,
  onDelete,
  isLoading = false,
}) => {
  const getStatusColor = (status: PropertyStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new property listing.
        </p>
        <div className="mt-6">
          <Link
            to="/properties/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Link
          key={property.id}
          to={generatePropertyUrl(property.id, property)}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow block"
        >
          {/* Property Image */}
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

          {/* Property Details */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}
              >
                {property.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-2 truncate">{property.address}</p>
            <p className="text-sm text-gray-500 mb-3">
              {property.city}, {property.province}
            </p>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-1"
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
                  {property.bedrooms} bed
                </span>
                <span className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-1"
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
            </div>

            <p className="text-xl font-bold text-blue-600 mb-4">
              {formatCurrency(property.rentAmount)}/mo
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between border-t pt-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/properties/${property.id}/edit`;
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </button>

              {onStatusChange && (
                <select
                  value={property.status}
                  onChange={(e) => {
                    e.preventDefault();
                    onStatusChange(property.id, e.target.value as PropertyStatus);
                  }}
                  onClick={(e) => e.preventDefault()}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm('Are you sure you want to delete this property?')) {
                      onDelete(property.id);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default PropertyList;
