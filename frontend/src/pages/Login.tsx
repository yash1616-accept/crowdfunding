import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <SignIn routing="path" path="/login" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
