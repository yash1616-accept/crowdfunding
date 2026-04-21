import React from 'react';
import { Rocket, LogOut, Compass, LayoutDashboard } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded || !user) return null;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/explore" className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
            <Rocket className="w-6 h-6" />
            <span>FundSphere</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/explore" 
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${location.pathname === '/explore' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Compass className="w-4 h-4" /> Explore
            </Link>
            {((user.publicMetadata?.role as string) || 'Creator') === 'Creator' && (
              <Link 
                to="/dashboard" 
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${location.pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Creator Studio
              </Link>
            )}
            {/* Future Services Placeholders */}
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors text-gray-400 hover:text-gray-500 cursor-not-allowed"
              title="Coming Soon"
            >
              Analytics <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors text-gray-400 hover:text-gray-500 cursor-not-allowed"
              title="Coming Soon"
            >
              Community <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">Soon</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold text-gray-900">{user.primaryEmailAddress?.emailAddress}</div>
            <div className="text-xs text-brand-blue">{user.publicMetadata?.role as string || 'Investor'}</div>
          </div>
          <button 
            onClick={() => signOut()} 
            className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
