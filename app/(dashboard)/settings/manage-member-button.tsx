'use client';

import { useState } from 'react';
import { updateMemberRole, removeMember } from './actions';

interface ManageMemberButtonProps {
  userId: string;
  currentRole: string;
  userName: string;
}

export function ManageMemberButton({ userId, currentRole, userName }: ManageMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateRole = async () => {
    setIsLoading(true);
    setError('');

    const result = await updateMemberRole(userId, selectedRole);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }

    setIsLoading(false);
  };

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${userName} from the organization?`)) {
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await removeMember(userId);

    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }

    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900"
      >
        Manage
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage {userName}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="org:member">Member</option>
                  <option value="org:admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedRole === 'org:admin'
                    ? 'Admins have full access to all features'
                    : 'Members can view leads and add comments'}
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {selectedRole !== currentRole && (
                  <button
                    onClick={handleUpdateRole}
                    disabled={isLoading}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Role'}
                  </button>
                )}

                <button
                  onClick={handleRemove}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                >
                  {isLoading ? 'Removing...' : 'Remove from Organization'}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
