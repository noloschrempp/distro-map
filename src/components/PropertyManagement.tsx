import { useState, useEffect } from 'react';
import { Property } from '../models/types';
import { getProperties, deleteProperty } from '../api/properties';
import PropertyForm from './PropertyForm';
import { Building2, MapPin, Edit, Trash2, Plus, Compass } from 'lucide-react';

interface PropertyManagementProps {
  onClose: () => void;
}

export default function PropertyManagement({ onClose }: PropertyManagementProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined);
  
  // Fetch properties on mount
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const data = await getProperties();
        setProperties(data);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProperties();
  }, []);
  
  const handleAddProperty = () => {
    setEditingProperty(undefined);
    setShowForm(true);
  };
  
  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowForm(true);
  };
  
  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await deleteProperty(id);
      setProperties(properties.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property. Please try again.');
    }
  };
  
  const handleSaveProperty = (property: Property) => {
    if (editingProperty) {
      // Update existing property in the list
      setProperties(properties.map(p => p.id === property.id ? property : p));
    } else {
      // Add new property to the list
      setProperties([...properties, property]);
    }
    setShowForm(false);
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProperty(undefined);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Compass size={24} className="text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Manage Properties</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto flex-grow">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {showForm ? (
          <PropertyForm 
            property={editingProperty} 
            onSave={handleSaveProperty} 
            onCancel={handleCancelForm} 
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Your Properties</h3>
              <button
                onClick={handleAddProperty}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus size={16} className="mr-2" />
                Add Property
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading properties...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Building2 size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No properties yet</h3>
                <p className="mt-2 text-gray-500">Add your first property to get started.</p>
                <button
                  onClick={handleAddProperty}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus size={16} className="mr-2" />
                  Add Property
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map(property => (
                  <div 
                    key={property.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {property.property_type === 'Retail' ? (
                            <Building2 size={20} className="text-blue-600" />
                          ) : (
                            <MapPin size={20} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{property.name}</h4>
                          <p className="text-gray-500 mt-1">
                            {property.address_line_1}, {property.address_city}, {property.address_state} {property.postal_code}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">
                              {property.property_type || 'Property'}
                            </span>
                            {property.square_footage && (
                              <span className="text-gray-500">
                                {property.square_footage.toLocaleString()} sq ft
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProperty(property)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Edit property"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete property"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {!showForm && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}