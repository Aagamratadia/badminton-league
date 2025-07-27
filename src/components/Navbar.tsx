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
  UserPlus
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-elegant">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-sport-primary hover:text-sport-primary/80 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            RAK
          </Link>
          <span className="ml-2 text-xs font-bold text-muted-foreground tracking-widest uppercase bg-sport-muted px-2 py-1 rounded-sm">
            League
          </span>
        </div>
        {/* Nav Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {session ? (
            <>
              {session.user?.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-sport-accent/10 text-sport-accent border-sport-accent/20 hover:bg-sport-accent hover:text-primary-foreground transition-all duration-200"
                >
                  <Link href="/admin/settings" className="flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-secondary"
              >
                <Link href="/dashboard" className="flex items-center gap-1">
                  <LayoutDashboard className="w-3 h-3" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                asChild
                className="bg-sport-primary hover:bg-sport-primary/90"
              >
                <Link href="/users" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="hidden sm:inline">Players</span>
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                asChild
              >
                <Link href="/api/auth/signout" className="flex items-center gap-1">
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                asChild
                className="bg-sport-primary hover:bg-sport-primary/90"
              >
                <Link href="/login" className="flex items-center gap-1">
                  <LogIn className="w-3 h-3" />
                  Sign In
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-secondary"
              >
                <Link href="/register" className="flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
