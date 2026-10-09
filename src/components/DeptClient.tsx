'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeptLayoutProps {
  children: React.ReactNode;
  departmentName?: string;
  isLoggedIn: boolean;
}

export default function DeptClient({ children, departmentName, isLoggedIn }: DeptLayoutProps) {
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleDemoLogin() {
    setLoggingIn(true);
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' });
      const data = await res.json();
      if (data.session) {
        // Store session in localStorage for the Supabase browser client
        localStorage.setItem('supabase-auth-token', JSON.stringify(data.session));
        router.refresh();
      } else {
        alert('Demo login failed: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Demo login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-5xl mb-4">🏗️</div>
          <h1 className="text-2xl font-bold mb-2">Department Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Log in as a department to create and manage public works projects.
          </p>
          <button
            onClick={handleDemoLogin}
            disabled={loggingIn}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition text-lg"
          >
            {loggingIn ? 'Logging in...' : '🔑 Try as Department (Demo)'}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            This logs into a shared demo account. No signup required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Department Dashboard</h1>
          {departmentName && (
            <p className="text-sm text-gray-500">Logged in as: {departmentName}</p>
          )}
        </div>
        <a
          href="/dept/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition"
        >
          + New Work Project
        </a>
      </div>
      {children}
    </div>
  );
}
