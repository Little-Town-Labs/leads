'use client';

import { useState } from 'react';
import { updateBranding } from './actions';
import { Palette } from 'lucide-react';

type BrandingFormProps = {
  branding: {
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily?: string;
    faviconUrl?: string;
  };
};

export function BrandingForm({ branding }: BrandingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateBranding(formData);

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
        <Palette className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-medium text-gray-900">Brand Colors & Assets</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
            <input
              type="url"
              name="logoUrl"
              defaultValue={branding.logoUrl || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/logo.png"
            />
            <p className="mt-1 text-xs text-gray-500">URL to your logo image</p>
          </div>

          {/* Favicon URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Favicon URL</label>
            <input
              type="url"
              name="faviconUrl"
              defaultValue={branding.faviconUrl || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/favicon.ico"
            />
            <p className="mt-1 text-xs text-gray-500">URL to your favicon</p>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                name="primaryColor"
                defaultValue={branding.primaryColor}
                className="h-10 w-20 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                defaultValue={branding.primaryColor}
                onInput={(e) => {
                  const colorInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (colorInput) colorInput.value = e.currentTarget.value;
                }}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="#3B82F6"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Main brand color (hex)</p>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                name="secondaryColor"
                defaultValue={branding.secondaryColor}
                className="h-10 w-20 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                defaultValue={branding.secondaryColor}
                onInput={(e) => {
                  const colorInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (colorInput) colorInput.value = e.currentTarget.value;
                }}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="#10B981"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Accent color (hex)</p>
          </div>

          {/* Font Family */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Font Family (optional)</label>
            <input
              type="text"
              name="fontFamily"
              defaultValue={branding.fontFamily || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Inter, sans-serif"
            />
            <p className="mt-1 text-xs text-gray-500">CSS font-family value</p>
          </div>
        </div>

        {success && (
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">Branding updated successfully!</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
}
