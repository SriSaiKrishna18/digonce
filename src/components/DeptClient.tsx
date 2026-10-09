'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

interface DeptLayoutProps {
  children: React.ReactNode;
  departmentName?: string;
  isLoggedIn: boolean;
  userEmail?: string;
}

export default function DeptClient({ children, departmentName, isLoggedIn, userEmail }: DeptLayoutProps) {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dept`,
        },
      });
      if (error) throw error;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert('Google sign-in failed. Please try again.');
      setSigningIn(false);
    }
  }

  async function handleDemoLogin() {
    setDemoLoading(true);
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' });
      const data = await res.json();
      if (data.session) {
        localStorage.setItem('supabase-auth-token', JSON.stringify(data.session));
        router.refresh();
      } else {
        alert('Demo login failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-16 px-5">
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold tracking-tight mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Department Portal
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to register public works, manage schedules, and receive real-time conflict alerts before breaking ground.
          </p>
        </div>

        <div className="space-y-3">
          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-all hover:shadow-sm disabled:opacity-50"
            style={{
              border: '1px solid var(--color-border-default)',
              backgroundColor: 'white',
              color: 'var(--color-text-primary)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {signingIn ? 'Redirecting…' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-default)' }} />
            <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border-default)' }} />
          </div>

          {/* Demo login */}
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full px-4 py-3 rounded-md text-[14px] font-medium transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-surface-inverse)',
              color: 'var(--color-text-inverse)',
            }}
          >
            {demoLoading ? 'Signing in…' : 'Try as Demo Department'}
          </button>
          <p className="text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Shared demo account. No signup required.
          </p>
        </div>

        {/* What departments can do */}
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--color-border-default)' }}>
          <h3 className="text-[12px] font-medium mb-4" style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>
            WHAT YOU CAN DO
          </h3>
          <ul className="space-y-3">
            {[
              { title: 'Register Works', desc: 'File excavation, pipeline, and infrastructure projects with dates and road segments' },
              { title: 'Conflict Detection', desc: 'Real-time alerts when your project overlaps, violates moratorium, or could merge with another department' },
              { title: 'Delay Ledger', desc: 'Record delays with mandatory reasons — publicly visible accountability' },
            ].map(item => (
              <li key={item.title} className="flex gap-3">
                <div className="w-1 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: 'var(--color-brand-500)', height: '2.5rem' }} />
                <div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.title}</div>
                  <div className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Department Dashboard
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {userEmail || departmentName || 'Signed in'}
          </p>
        </div>
        <a
          href="/dept/new"
          className="text-[13px] font-medium px-4 py-2 rounded-md transition-opacity hover:opacity-85"
          style={{
            backgroundColor: 'var(--color-brand-600)',
            color: 'white',
          }}
        >
          Register New Work
        </a>
      </div>
      {children}
    </div>
  );
}
