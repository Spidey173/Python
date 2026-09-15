'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping" />
            <div className="w-12 h-12 rounded-full border-2 border-red-500/30 border-t-red-400 animate-spin" />
          </div>
          <p className="text-sm text-red-400/80 font-mono tracking-wider animate-pulse">
            VERIFYING ADMIN PRIVILEGES...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-950/20 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 mb-6">
            Administrator clearance required to access the mainframe console.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl font-mono text-sm transition-all"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
