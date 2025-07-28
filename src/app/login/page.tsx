'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      ...form,
      redirect: false,
    });
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      if (res?.error?.toLowerCase().includes('pending admin approval')) {
        setError('Your account is pending admin approval. Please wait for approval.');
      } else {
        setError('Invalid email or password.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-100 to-blue-200 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-14 h-14 bg-cyan-400/20 rounded-full flex items-center justify-center mb-4 shadow-md">
              <div className="w-8 h-8 bg-cyan-500 rounded-full shadow-cyan-200 shadow-lg" />
            </div>
            <CardTitle className="text-2xl font-bold text-cyan-800">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-cyan-700/80">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="mb-2 bg-red-200">
                <AlertDescription className="text-black">{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="pl-10 h-12 border-input focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="pl-10 h-12 border-input focus:border-cyan-500 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  New to the league?
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              asChild
              className="w-full h-12 border-border hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              <Link href="/register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
