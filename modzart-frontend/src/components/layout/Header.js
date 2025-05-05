"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
            {/* Replace with actual logo if available */}
            <div className="w-5 h-5 bg-zinc-950 rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-white">Modzart</span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/discover" className="text-white hover:text-gray-300 transition">
            Discover content
          </Link>
          <Link href="/project-publish" className="text-white hover:text-gray-300 transition">
            Host a server
          </Link>
          <Link href="/project-publish" className="text-white hover:text-gray-300 transition">
            Get Modzart App
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link href="/user-management/login">
                <Button className="bg-green-500 hover:bg-green-600 text-black font-medium rounded-md">
                  Sign in
                </Button>
              </Link>
              <Link href="/user-management/signup">
                <Button variant="outline" className="border-white text-white hover:bg-zinc-800 rounded-md">
                  Sign up
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/profile">
              <Button variant="outline" className="border-white text-white hover:bg-zinc-800 rounded-md">
                Profile
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}