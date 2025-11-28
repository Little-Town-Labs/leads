'use client';

import { useState } from 'react';
import { EmailSequence } from '@/db/schema';
import { Edit, Trash2, Clock, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import { deleteEmailSequence, toggleEmailSequenceStatus } from './actions';
import { EditSequenceModal } from './edit-sequence-modal';

type EmailSequenceListProps = {
  sequences: EmailSequence[];
};

export function EmailSequenceList({ sequences }: EmailSequenceListProps) {
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleDelete = async (id: string, subject: string) => {
    if (!confirm(`Are you sure you want to delete this email sequence: "${subject}"?`)) {
      return;
    }

    setIsDeleting(id);
    const result = await deleteEmailSequence(id);

    if (result.error) {
      alert(result.error);
    }

    setIsDeleting(null);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setIsToggling(id);
    const result = await toggleEmailSequenceStatus(id, !currentStatus);

    if (result.error) {
      alert(result.error);
    }

    setIsToggling(null);
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, { name: string; color: string }> = {
      cold: { name: 'Cold Leads', color: 'bg-blue-100 text-blue-800' },
      warm: { name: 'Warm Leads', color: 'bg-orange-100 text-orange-800' },
      hot: { name: 'Hot Leads', color: 'bg-red-100 text-red-800' },
      qualified: { name: 'Qualified Leads', color: 'bg-green-100 text-green-800' },
    };
    return labels[tier] || { name: tier, color: 'bg-gray-100 text-gray-800' };
  };

  const groupedSequences = sequences.reduce((acc, seq) => {
    if (!acc[seq.tier]) {
      acc[seq.tier] = [];
    }
    acc[seq.tier].push(seq);
    return acc;
  }, {} as Record<string, EmailSequence[]>);

  // Sort sequences within each tier by sequenceNumber
  Object.keys(groupedSequences).forEach(tier => {
    groupedSequences[tier].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  });

  if (sequences.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No email sequences yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first email sequence
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedSequences).map(([tier, tierSequences]) => {
          const tierInfo = getTierLabel(tier);
          return (
            <div key={tier}>
              <div className="mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color}`}>
                  {tierInfo.name}
                </span>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {tierSequences.map((sequence) => (
                    <li key={sequence.id} className="hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Email #{sequence.sequenceNumber}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                <Clock className="w-3 h-3" />
                                {sequence.delayDays === 0 ? 'Immediate' : `Day ${sequence.delayDays}`}
                              </span>
                              {!sequence.isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {sequence.subject}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {sequence.body.substring(0, 150)}
                              {sequence.body.length > 150 ? '...' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleToggle(sequence.id, sequence.isActive)}
                              disabled={isToggling === sequence.id}
                              className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 ${
                                sequence.isActive ? 'text-green-600' : 'text-gray-400'
                              }`}
                              title={sequence.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {sequence.isActive ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingSequence(sequence)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Edit sequence"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(sequence.id, sequence.subject)}
                              disabled={isDeleting === sequence.id}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Delete sequence"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {editingSequence && (
        <EditSequenceModal
          sequence={editingSequence}
          onClose={() => setEditingSequence(null)}
        />
      )}
    </>
  );
}
