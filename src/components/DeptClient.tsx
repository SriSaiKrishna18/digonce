'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DeptClientProps {
  children?: React.ReactNode;
  departmentName?: string;
  isLoggedIn: boolean;
  userEmail?: string;
}

export default function DeptClient({ children, departmentName, isLoggedIn, userEmail }: DeptClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback?next=/dept' }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDemoAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@digonce.dev',
        password: 'DemoDigOnce2026!'
      });
      if (error) throw error;
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isLoggedIn) {
    return (
      <div className="w-full flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <header className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <div className="flex items-center gap-4">
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{departmentName || 'Department'}</span>
            <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{userEmail}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dept/new')} className="px-4 py-2 text-[14px] rounded-md font-medium" style={{ backgroundColor: 'var(--color-brand-600)', color: 'white' }}>
              Register New Work
            </button>
            <button onClick={handleSignOut} className="px-4 py-2 text-[14px] rounded-md border font-medium" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
              Sign Out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-lg border shadow-sm" style={{ borderColor: 'var(--color-border-default)' }}>
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-text-primary)', fontFamily: 'DM Sans, sans-serif' }}>Department Access</h2>
        
        {error && <div className="mb-4 p-3 rounded text-[13px]" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>{error}</div>}

        <button onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-3 py-2 border rounded-md mb-6 hover:bg-gray-50" style={{ borderColor: 'var(--color-border-default)' }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>Continue with Google</span>
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-default)' }}></div>
          <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-default)' }}></div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-[14px]"
              style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-primary)' }}
              required 
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-[14px]"
              style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface-primary)' }}
              required 
            />
          </div>
          <button type="submit" className="w-full py-2 rounded-md text-[14px] font-medium text-white" style={{ backgroundColor: 'var(--color-brand-600)' }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          <div className="text-center text-[13px]">
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-default)' }}></div>
          <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-default)' }}></div>
        </div>

        <button onClick={handleDemoAuth} className="w-full py-2 border rounded-md text-[14px] font-medium mb-6 hover:bg-gray-50" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
          Try as Demo Department
        </button>

        <div className="mt-8">
          <h3 className="text-[14px] font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>Features:</h3>
          <ul className="space-y-2 text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            <li className="flex items-center gap-2">
              <span style={{ color: 'var(--color-brand-600)' }}>✓</span> Register Works
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'var(--color-brand-600)' }}>✓</span> Conflict Detection
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'var(--color-brand-600)' }}>✓</span> Delay Ledger
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
