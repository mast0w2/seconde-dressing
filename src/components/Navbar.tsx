"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">SD</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Seconde Dressing</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={"font-medium transition-colors " + (isActive("/") ? "text-primary-600" : "text-gray-600 hover:text-primary-600")}
            >
              Home
            </Link>
            <Link
              href="/book"
              className={"font-medium transition-colors " + (isActive("/book") ? "text-primary-600" : "text-gray-600 hover:text-primary-600")}
            >
              Book Appointment
            </Link>
            <Link
              href="/dashboard"
              className={"font-medium transition-colors " + (isActive("/dashboard") ? "text-primary-600" : "text-gray-600 hover:text-primary-600")}
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary-600 hover:bg-primary-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}