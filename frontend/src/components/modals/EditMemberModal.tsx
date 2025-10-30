import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { type Member, memberService } from '../../services/memberService';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member | null;
}

interface MemberFormData {
  name: string;
  ageGroup: 'child' | 'youth' | 'adult';
  gender: 'male' | 'female';
  residence: string;
  phone: string;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, onSuccess, member }) => {
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    ageGroup: 'adult',
    gender: 'male',
    residence: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        ageGroup: member.ageGroup,
        gender: member.gender,
        residence: member.residence,
        phone: member.phone || ''
      });
    }
  }, [member]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare data for submission - NO ID NUMBER
      const submitData = {
        name: formData.name,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
        residence: formData.residence,
        phone: formData.phone || undefined
      };

      await memberService.updateMember(member.memberId, submitData);
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      ageGroup: 'adult',
      gender: 'male',
      residence: '',
      phone: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen || !member) return null;

  const isYouthOrAdult = formData.ageGroup === 'youth' || formData.ageGroup === 'adult';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Save className="h-5 w-5 mr-2" />
            Edit Member
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-1">
                Age Group *
              </label>
              <select
                id="ageGroup"
                name="ageGroup"
                required
                value={formData.ageGroup}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="child">Child</option>
                <option value="youth">Youth</option>
                <option value="adult">Adult</option>
              </select>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="residence" className="block text-sm font-medium text-gray-700 mb-1">
              Residence *
            </label>
            <input
              type="text"
              id="residence"
              name="residence"
              required
              value={formData.residence}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter residence"
            />
          </div>

          {isYouthOrAdult ? (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required={isYouthOrAdult}
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="254XXXXXXXXX"
                pattern="254\d{9}"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">Format: 254XXXXXXXXX</p>
            </div>
          ) : (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional for children"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberModal;