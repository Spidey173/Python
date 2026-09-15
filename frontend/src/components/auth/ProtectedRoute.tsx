'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowGuest?: boolean;
}

export function ProtectedRoute({ children, allowGuest = true }: ProtectedRouteProps) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/?auth=signin');
      } else if (!allowGuest && isGuest) {
        router.replace('/?auth=signin');
      }
    }
  }, [user, loading, isGuest, allowGuest, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          </div>
          <p className="text-sm text-cyan-400/80 font-mono tracking-wider animate-pulse">
            AUTHENTICATING SESSION...
          </p>
        </div>
      </div>
    );
  }

  if (!user || (!allowGuest && isGuest)) {
    return null;
  }

  return <>{children}</>;
}
