'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (res?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {params.get('registered') && <div className="text-green-600 text-sm text-center">Registration successful. Please login.</div>}
        <input name="email" type="email" placeholder="Email" required className="w-full p-2 border border-slate-300 rounded-lg" value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" required className="w-full p-2 border border-slate-300 rounded-lg" value={form.password} onChange={handleChange} />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <div className="text-center text-sm text-slate-500">Don't have an account? <Link href="/register" className="text-cyan-600 font-semibold">Register</Link></div>
      </form>
    </div>
  );
}
