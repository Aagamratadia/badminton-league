"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  LayoutDashboard,
  Users,
  LogOut,
  LogIn,
  UserPlus,
  Swords,
  User,
  Archive
} from "lucide-react";

// ProfileDropdown for navbar user icon
import React from "react";

function ProfileDropdown({ userId }: { userId: string }) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative ml-2" ref={dropdownRef}>
      <button
        className="flex items-center justify-center rounded-full bg-cyan-800/70 hover:bg-cyan-700 transition-colors w-10 h-10 border border-cyan-900 shadow focus:outline-none focus:ring-2 focus:ring-cyan-400"
        title="My Profile"
        aria-label="My Profile"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <User className="w-6 h-6 text-cyan-100" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-fade-in">
          <Link
            href={`/users/${userId}`}
            className="block px-4 py-3 text-slate-800 hover:bg-cyan-50 rounded-t-lg transition-colors text-base"
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> Profile</span>
          </Link>
          <Link
            href="/api/auth/signout"
            className="block px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg transition-colors text-base"
            onClick={() => setOpen(false)}
          >
            <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-cyan-800/30 bg-gradient-to-r from-cyan-800 via-cyan-700 to-cyan-600/90 backdrop-blur-lg shadow-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-6">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-lg hover:text-cyan-200 transition-colors rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
          >
            RAK
          </Link>
          <span className="ml-2 text-xs font-bold text-cyan-100 tracking-widest uppercase bg-cyan-900/60 px-2 py-1 rounded shadow-sm border border-cyan-700">
            League
          </span>
        </div>
        {/* Hamburger for mobile */}
        <button
          className="sm:hidden flex items-center px-3 py-2 border rounded text-cyan-100 border-cyan-400 hover:text-cyan-200 hover:border-cyan-200 focus:outline-none"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
        >
          <svg className="fill-current h-6 w-6" viewBox="0 0 20 20"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" /></svg>
        </button>
        {/* Nav Links - Desktop */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-3">
          {session ? (
            <>
              {session.user?.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="bg-cyan-100/10 text-cyan-100 border-cyan-200/20 hover:bg-cyan-100 hover:text-cyan-800 transition-all duration-200 rounded-lg shadow-sm"
                  >
                    <Link href="/admin/settings" className="flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline font-semibold">Admin</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="bg-cyan-100/10 text-cyan-100 border-cyan-200/20 hover:bg-cyan-100 hover:text-cyan-800 transition-all duration-200 rounded-lg shadow-sm"
                  >
                    <Link href="/inventory" className="flex items-center gap-1">
                      <Archive className="w-4 h-4" />
                      <span className="hidden sm:inline font-semibold">Inventory</span>
                    </Link>
                  </Button>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Link href="/challenge">
                  <Button variant="ghost" className="text-white hover:bg-cyan-600/80 hover:text-cyan-100 rounded-lg px-3 py-2 transition-all">
                    <Users className="mr-2 h-4 w-4" />
                    2v2 Challenge
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-white hover:bg-cyan-600/80 hover:text-cyan-100 rounded-lg px-3 py-2 transition-all">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
              <ProfileDropdown userId={session.user.id} />
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                asChild
                className="bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg px-3 py-2 transition-all"
              >
                <Link href="/login" className="flex items-center gap-1">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-cyan-900/40 text-cyan-100 rounded-lg px-3 py-2 transition-all"
              >
                <Link href="/register" className="flex items-center gap-1">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-cyan-900/95 px-4 pt-2 pb-4 shadow-lg border-t border-cyan-800 animate-fade-in">
          {session ? (
            <>
              {session.user?.role === "admin" && (
                <Link href="/admin/settings" className="block py-2 px-2 text-cyan-100 hover:bg-cyan-800 rounded transition-colors">
                  <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Admin</span>
                </Link>
              )}
              <Link href="/challenge" className="block py-2 px-2 text-cyan-100 hover:bg-cyan-800 rounded transition-colors">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> 2v2 Challenge</span>
              </Link>
              <Link href="/dashboard" className="block py-2 px-2 text-cyan-100 hover:bg-cyan-800 rounded transition-colors">
                <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
              </Link>
              <div className="mt-2">
                <ProfileDropdown userId={session.user.id} />
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 px-2 text-cyan-100 hover:bg-cyan-800 rounded transition-colors">
                <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>
              </Link>
              <Link href="/register" className="block py-2 px-2 text-cyan-100 hover:bg-cyan-800 rounded transition-colors">
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Sign Up</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
