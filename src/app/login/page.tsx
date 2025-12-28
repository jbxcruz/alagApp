'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button, Input, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeletedMessage, setShowDeletedMessage] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (searchParams.get('deleted') === 'true') {
      setShowDeletedMessage(true);
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex overflow-x-hidden w-full">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="AlagApp Logo" width={40} height={40} className="rounded-xl" />
            <span className="text-2xl font-bold">AlagApp</span>
          </Link>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-4">Your Health Journey Starts Here</h1>
            <p className="text-lg text-white/80">Track your vitals, manage medications, and get AI-powered insights.</p>
          </div>
          <p className="text-sm text-white/60">© {new Date().getFullYear()} AlagApp</p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 w-full">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo.svg" alt="AlagApp Logo" width={40} height={40} className="rounded-xl" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">AlagApp</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Sign in to your account to continue</p>
          </div>

          {showDeletedMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">Account deleted successfully</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">Your account and all associated data have been permanently removed.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <Input 
                  type="email" 
                  placeholder="you@example.com" 
                  leftIcon={<Mail className="h-4 w-4" />} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    leftIcon={<Lock className="h-4 w-4" />} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account? <Link href="/register" className="text-primary-500 hover:text-primary-600 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}