'use client';

import { useState } from 'react';
import { KnowledgeBaseDoc } from '@/db/schema';
import { FileText, Trash2, Eye, EyeOff } from 'lucide-react';
import { deleteKnowledgeBaseDoc, toggleDocumentActive } from './actions';

type KnowledgeBaseListProps = {
  documents: KnowledgeBaseDoc[];
};

export function KnowledgeBaseList({ documents }: KnowledgeBaseListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setProcessingId(id);
    const result = await deleteKnowledgeBaseDoc(id);

    if (result.error) {
      alert(result.error);
    }

    setProcessingId(null);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    const result = await toggleDocumentActive(id, !currentStatus);

    if (result.error) {
      alert(result.error);
    }

    setProcessingId(null);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <li key={doc.id} className="hover:bg-gray-50">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {doc.contentType}
                      </span>
                      {!doc.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{doc.content.slice(0, 200)}...</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {doc.content.length} characters
                      </span>
                      <span>•</span>
                      <span>
                        Added {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      {doc.metadata && typeof doc.metadata === 'object' && 'category' in doc.metadata && (
                        <>
                          <span>•</span>
                          <span>
                            {String((doc.metadata as Record<string, unknown>).category)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggle(doc.id, doc.isActive)}
                    disabled={processingId === doc.id}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                    title={doc.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {doc.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.title)}
                    disabled={processingId === doc.id}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Delete"
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
  );
}
