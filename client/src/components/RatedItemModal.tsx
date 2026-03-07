import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';

interface RatedItemModalProps {
  itemId: string;
  itemType: 'procedure' | 'presentation';
  onClose: () => void;
}

export default function RatedItemModal({ itemId, itemType, onClose }: RatedItemModalProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId, itemType]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      if (itemType === 'procedure') {
        // Fetch all logs including rated ones
        const response = await api.get('/logs/my-logs?yearId=all');
        const procedure = response.data.find((p: any) => p.id === itemId);
        setItem(procedure);
      } else {
        // Fetch all presentations including rated ones
        const response = await api.get('/presentations/my-presentations');
        const presentation = response.data.find((p: any) => p.id === parseInt(itemId));
        setItem(presentation);
      }
    } catch (error) {
      console.error('Failed to fetch item details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <p className="text-gray-600">Item not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">
            {itemType === 'procedure' ? 'Procedure Details' : 'Presentation Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {itemType === 'procedure' ? (
          <div className="space-y-3">
            <p><strong>Date:</strong> {format(new Date(item.date), 'MMM dd, yyyy')}</p>
            <p><strong>Procedure:</strong> {item.procedure}</p>
            <p><strong>Diagnosis:</strong> {item.diagnosis}</p>
            <p><strong>Type:</strong> {item.procedure_type?.replace(/_/g, ' ')}</p>
            <p><strong>Role:</strong> {item.surgery_role?.replace(/_/g, ' ')}</p>
            <p><strong>Place:</strong> {item.place_of_practice}</p>
            {item.remark && <p><strong>Remark:</strong> {item.remark}</p>}
            
            {item.rating && (
              <div className="border-t pt-3 mt-3">
                <p><strong>Rating:</strong> <span className={`text-2xl font-bold ${item.rating > 50 ? 'text-green-600' : 'text-red-600'}`}>{item.rating}/100</span></p>
                {item.comment && <p className="mt-2"><strong>Comment:</strong> {item.comment}</p>}
                <p className="text-sm text-gray-500 mt-2">Rated on {format(new Date(item.rated_at), 'MMM dd, yyyy')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p><strong>Date:</strong> {format(new Date(item.date), 'MMM dd, yyyy')}</p>
            <p><strong>Title:</strong> {item.title}</p>
            <p><strong>Type:</strong> {item.presentation_type?.replace(/_/g, ' ')}</p>
            <p><strong>Venue:</strong> {item.venue}</p>
            {item.description && <p><strong>Description:</strong> {item.description}</p>}
            <p><strong>Rated by:</strong> {item.supervisor_name || 'Not assigned'}</p>
            
            {item.rating && (
              <div className="border-t pt-3 mt-3">
                <p><strong>Rating:</strong> <span className={`text-2xl font-bold ${item.rating > 50 ? 'text-green-600' : 'text-red-600'}`}>{item.rating}/100</span></p>
                {item.comment && <p className="mt-2"><strong>Comment:</strong> {item.comment}</p>}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
