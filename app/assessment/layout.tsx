import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Desk Health Assessment | Timeless Technology Solutions',
  description: 'Transform your help desk data into actionable insights with DDIP. Take our free 5-minute assessment to discover your improvement potential.',
};

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
