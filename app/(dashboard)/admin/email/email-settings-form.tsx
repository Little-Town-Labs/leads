'use client';

import { useState } from 'react';
import { updateEmailSettings } from './actions';
import { Mail } from 'lucide-react';

type EmailSettingsFormProps = {
  settings: {
    emailFromName?: string;
    emailFromAddress?: string;
    quizCompletionRedirect?: string;
    enableAiResearch: boolean;
    qualificationThreshold: number;
  };
};

export function EmailSettingsForm({ settings }: EmailSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateEmailSettings(formData);

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
        <Mail className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">From Name</label>
            <input
              type="text"
              name="emailFromName"
              defaultValue={settings.emailFromName || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Company"
            />
            <p className="mt-1 text-xs text-gray-500">Sender name in emails</p>
          </div>

          {/* From Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700">From Email Address</label>
            <input
              type="email"
              name="emailFromAddress"
              defaultValue={settings.emailFromAddress || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="noreply@yourcompany.com"
            />
            <p className="mt-1 text-xs text-gray-500">Must be verified with Resend</p>
          </div>

          {/* Quiz Completion Redirect */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Quiz Completion Redirect URL</label>
            <input
              type="url"
              name="quizCompletionRedirect"
              defaultValue={settings.quizCompletionRedirect || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://yoursite.com/thank-you"
            />
            <p className="mt-1 text-xs text-gray-500">Where to send leads after completing the quiz</p>
          </div>
        </div>

        <hr className="my-6" />

        <h4 className="text-md font-medium text-gray-900 mb-3">AI Workflow Settings</h4>

        <div className="space-y-4">
          {/* Enable AI Research */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="enableAiResearch"
                value="true"
                defaultChecked={settings.enableAiResearch}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label className="text-sm font-medium text-gray-900">
                Enable AI Research
              </label>
              <p className="text-xs text-gray-500">
                Run AI research workflows on qualified leads
              </p>
            </div>
          </div>

          {/* Qualification Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Qualification Threshold ({settings.qualificationThreshold}%)
            </label>
            <input
              type="range"
              name="qualificationThreshold"
              min="0"
              max="100"
              step="5"
              defaultValue={settings.qualificationThreshold}
              onInput={(e) => {
                const label = e.currentTarget.previousElementSibling as HTMLLabelElement;
                if (label) {
                  label.textContent = `Qualification Threshold (${e.currentTarget.value}%)`;
                }
              }}
              className="mt-1 block w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leads above this score trigger AI research workflows
            </p>
          </div>
        </div>

        {success && (
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-800">Settings updated successfully!</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
