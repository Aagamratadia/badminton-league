'use client';
import { signOut } from 'next-auth/react';

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className = '' }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={`${className} bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors`}
    >
      Sign Out
    </button>
  );
}
