import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <div className="bg-card p-4 rounded">
          <SignIn path="/login" routing="path" />
        </div>
      </div>
    </div>
  );
}
