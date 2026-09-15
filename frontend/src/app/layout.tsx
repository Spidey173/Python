import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-client';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Python — Developer Workspace',
  description: 'A focused, distraction-free engineering workspace to master essential Python coding fundamentals for technical job interviews.',
  keywords: ['Python', 'Technical Interview', 'Coding Workspace', 'Coding Interview', 'VS Code', 'Data Structures', 'Algorithms'],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#0D1117]">
      <body className="h-full flex flex-col bg-[#0D1117] text-[#E6EDF3] selection:bg-[#1F6FEB]/30 selection:text-white antialiased overflow-hidden">
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
