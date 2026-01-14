"use client";

import { Home, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-[180px] font-bold text-gray-200 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="text-[#0088cc] w-20 h-20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Oops! The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <Link
            href="https://ops.fotober.com"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0088cc] text-white rounded-lg font-medium hover:bg-[#0077b3] transition-all shadow-sm"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-12 text-sm text-gray-500">
          Need help? Contact{" "}
          <a
            href="mailto:support@fotober.com"
            className="text-[#0088cc] hover:underline"
          >
            support@fotober.com
          </a>
        </p>

        {/* Fotober Logo/Brand */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-400 text-sm">
            © 2024 Fotober. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
