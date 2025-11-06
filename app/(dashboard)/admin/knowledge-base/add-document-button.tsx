'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createKnowledgeBaseDoc } from './actions';

export function AddDocumentButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createKnowledgeBaseDoc(formData);

    if (result.error) {
      alert(result.error);
      setIsSubmitting(false);
    } else {
      setIsOpen(false);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Document
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Knowledge Base Document</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Product Features Overview"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content Type</label>
                <select
                  name="contentType"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="document">Document</option>
                  <option value="faq">FAQ</option>
                  <option value="product_info">Product Info</option>
                  <option value="pricing">Pricing</option>
                  <option value="company_info">Company Info</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category (optional)</label>
                <input
                  type="text"
                  name="category"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sales, Support, Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (optional, comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="features, pricing, integration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content *</label>
                <textarea
                  name="content"
                  required
                  rows={10}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Paste your document content here. It will be automatically chunked and embedded for semantic search."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This content will be searchable by the AI research agent
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating & Embedding...' : 'Add Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              {isSubmitting && (
                <p className="text-xs text-gray-500 text-center">
                  Generating embeddings... This may take a moment.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
