import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحكم — steploot',
  robots: {index: false, follow: false}
};

// The admin panel is fully client-side and always fresh.
export const dynamic = 'force-dynamic';

export default function AdminLayout({children}: {children: React.ReactNode}) {
  return <div className="min-h-dvh bg-paper">{children}</div>;
}
