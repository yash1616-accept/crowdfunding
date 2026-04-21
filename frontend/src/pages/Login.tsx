import { SignIn } from '@clerk/clerk-react';
import { Rocket } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#030712] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] bg-blue-600 top-1/4 left-1/3 pointer-events-none" />
      
      <div className="flex items-center gap-2 text-white font-bold text-xl mb-8">
        <Rocket className="w-6 h-6 text-blue-400" />
        FundSphere
      </div>
      
      <SignIn 
        routing="path" 
        path="/login" 
        fallbackRedirectUrl="/explore"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
          }
        }}
      />
      
      <p className="mt-6 text-xs text-gray-600 text-center max-w-sm">
        Tip: To test with multiple accounts on the same PC, open an <span className="text-gray-400 font-semibold">Incognito / Private</span> browser window for each additional account.
      </p>
    </div>
  );
}
