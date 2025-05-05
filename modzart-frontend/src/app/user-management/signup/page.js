"use client";
import RegisterForm from "@/components/auth/RegisterForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Create Account</h1>
        <RegisterForm />
      </div>
    </div>
  );
}