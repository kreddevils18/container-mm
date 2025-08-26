"use client";

import type { ReactElement } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage(): ReactElement | null {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg px-8 py-10">
          <RegisterForm />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            © 2025 Hệ thống Quản lý Vận tải
          </p>
        </div>
      </div>
    </div>
  );
}