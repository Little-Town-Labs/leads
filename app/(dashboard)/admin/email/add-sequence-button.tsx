'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SequenceFormModal } from './sequence-form-modal';

export function AddSequenceButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Email Sequence
      </button>

      {isOpen && <SequenceFormModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
