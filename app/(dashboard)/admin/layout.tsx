import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Settings2,
  MessageSquare,
  Palette,
  Mail,
  Workflow,
  BookOpen
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canManageOrg = await hasPermission('org:manage');

  if (!canManageOrg) {
    redirect('/dashboard');
  }

  const navItems = [
    { href: '/admin/quiz', label: 'Quiz Builder', icon: MessageSquare },
    { href: '/admin/branding', label: 'Branding', icon: Palette },
    { href: '/admin/email', label: 'Email Templates', icon: Mail },
    { href: '/admin/workflows', label: 'AI Workflows', icon: Workflow },
    { href: '/admin/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-8 h-8" />
            Organization Admin
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure your organization's Lead Agent settings
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
