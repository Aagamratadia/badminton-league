'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }
      router.push('/login?registered=1');
    } catch (err) {
      setError('Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Register</h1>
        <input name="name" type="text" placeholder="Name" required className="w-full p-2 border border-slate-300 rounded-lg" value={form.name} onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" required className="w-full p-2 border border-slate-300 rounded-lg" value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" required className="w-full p-2 border border-slate-300 rounded-lg" value={form.password} onChange={handleChange} />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        <div className="text-center text-sm text-slate-500">Already have an account? <Link href="/login" className="text-cyan-600 font-semibold">Login</Link></div>
      </form>
    </div>
  );
}
