'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { EmailSequence } from '@/db/schema';
import { updateEmailSequence } from './actions';

type EditSequenceModalProps = {
  sequence: EmailSequence;
  onClose: () => void;
};

export function EditSequenceModal({ sequence, onClose }: EditSequenceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateEmailSequence(sequence.id, formData);

    if (result.error) {
      alert(result.error);
      setIsSubmitting(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Edit Email Sequence</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lead Tier
              </label>
              <select
                name="tier"
                defaultValue={sequence.tier}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cold">Cold Leads</option>
                <option value="warm">Warm Leads</option>
                <option value="hot">Hot Leads</option>
                <option value="qualified">Qualified Leads</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Which tier receives this email</p>
            </div>

            {/* Sequence Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sequence Number
              </label>
              <input
                type="number"
                name="sequenceNumber"
                min="1"
                defaultValue={sequence.sequenceNumber}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Order in the sequence (1, 2, 3...)</p>
            </div>

            {/* Delay Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delay (Days)
              </label>
              <input
                type="number"
                name="delayDays"
                min="0"
                defaultValue={sequence.delayDays}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Days after previous email (0 = immediate)</p>
            </div>

            {/* Active Status */}
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={sequence.isActive}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Subject
            </label>
            <input
              type="text"
              name="subject"
              defaultValue={sequence.subject}
              required
              placeholder="e.g., Thanks for your interest in {{company}}"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use variables: {'{{name}}, {{company}}, {{score}}'}
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Body
            </label>
            <textarea
              name="body"
              rows={10}
              defaultValue={sequence.body}
              required
              placeholder="Hi {{name}},&#10;&#10;Thanks for completing our assessment. Based on your score of {{score}}, we think...&#10;&#10;Best regards"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Available variables: {'{{name}}, {{email}}, {{company}}, {{score}}'}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Email Sequence Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Use personalization variables to make emails feel custom</li>
              <li>• Space out emails appropriately (e.g., 0, 3, 7, 14 days)</li>
              <li>• Keep emails focused on one clear call-to-action</li>
              <li>• Test sequences with small groups before full deployment</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Sequence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
