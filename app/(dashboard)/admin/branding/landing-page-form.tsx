'use client';

import { useState } from 'react';
import { updateLandingPage } from './actions';
import { FileText } from 'lucide-react';

type LandingPageFormProps = {
  landingPage: {
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
  };
};

export function LandingPageForm({ landingPage }: LandingPageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateLandingPage(formData);

    if (result.error) {
      alert(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-medium text-gray-900">Landing Page Content</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hero Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Hero Title *</label>
          <input
            type="text"
            name="heroTitle"
            required
            defaultValue={landingPage.heroTitle}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Welcome to Our Platform"
          />
          <p className="mt-1 text-xs text-gray-500">Main headline on your landing page</p>
        </div>

        {/* Hero Subtitle */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Hero Subtitle *</label>
          <textarea
            name="heroSubtitle"
            required
            defaultValue={landingPage.heroSubtitle}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Complete our assessment to get started"
          />
          <p className="mt-1 text-xs text-gray-500">Subheading text below the title</p>
        </div>

        {/* CTA Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Call-to-Action Button Text *</label>
          <input
            type="text"
            name="ctaText"
            required
            defaultValue={landingPage.ctaText}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Take Assessment"
          />
          <p className="mt-1 text-xs text-gray-500">Text on the main call-to-action button</p>
        </div>

        {success && (
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">Landing page updated successfully!</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Landing Page'}
          </button>
        </div>
      </form>
    </div>
  );
}
