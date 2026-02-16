import React from 'react';
import { Property, PropertyStatus } from '../../types/firebase';
import { Link } from 'react-router-dom';
import { generatePropertyUrl } from '../../utils/seo';
import {
  Card,
  Badge,
  Button,
  PropertyIcon,
  EditIcon,
  DeleteIcon,
  AddIcon,
  LocationIcon,
  MoneyIcon,
} from '../common';

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
  const getStatusVariant = (status: PropertyStatus) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'primary';
      case 'inactive':
        return 'secondary';
      default:
        return 'default';
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
      <Card className="text-center py-12" padding="xl">
        <PropertyIcon size="xl" className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No properties</h3>
        <p className="text-gray-500 mb-6">Get started by creating a new property listing.</p>
        <Button as={Link} to="/properties/create" leftIcon={AddIcon} size="lg">
          New Property
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Card key={property.id} className="overflow-hidden group" hover>
          <Link to={generatePropertyUrl(property.id, property)} className="block">
            {/* Property Image */}
            <div className="h-48 bg-gray-200 relative overflow-hidden">
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
                  <Badge variant="warning" size="sm">
                    Premium
                  </Badge>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <Badge variant={getStatusVariant(property.status)} size="sm">
                  {property.status}
                </Badge>
              </div>
            </div>

            {/* Property Details */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                  {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                </h3>
              </div>

              <div className="flex items-start mb-2">
                <LocationIcon size="sm" className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">{property.address}</p>
                  <p className="text-sm text-gray-500">
                    {property.city}, {property.province}
                  </p>
                </div>
              </div>

              {/* Property Features */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center">
                  <PropertyIcon size="xs" className="mr-1" />
                  {property.bedrooms} bed
                </span>
                <span className="flex items-center">
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
              <div className="flex items-center mb-4">
                <MoneyIcon size="sm" className="text-blue-600 mr-2" />
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(property.rentAmount)}/mo
                </span>
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between space-x-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={EditIcon}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  window.location.href = `/properties/${property.id}/edit`;
                }}
              >
                Edit
              </Button>

              {onStatusChange && (
                <select
                  value={property.status}
                  onChange={(e) => {
                    e.preventDefault();
                    onStatusChange(property.id, e.target.value as PropertyStatus);
                  }}
                  onClick={(e) => e.preventDefault()}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={DeleteIcon}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (window.confirm('Are you sure you want to delete this property?')) {
                      onDelete(property.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PropertyList;
