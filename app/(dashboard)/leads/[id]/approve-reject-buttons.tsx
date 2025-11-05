'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

export function ApproveRejectButtons({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this lead?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve lead');
      }

      router.refresh();
    } catch (error) {
      console.error('Error approving lead:', error);
      alert('Failed to approve lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this lead?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reject lead');
      }

      router.refresh();
    } catch (error) {
      console.error('Error rejecting lead:', error);
      alert('Failed to reject lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={handleReject}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        <XCircle className="mr-2 h-4 w-4" />
        Reject
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Approve
      </button>
    </div>
  );
}
