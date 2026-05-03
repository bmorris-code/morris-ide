import { Bell, UserCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div>
        <h1 className="text-white text-lg font-semibold">Morris IDE</h1>
        <p className="text-gray-400 text-xs">Secure AI-native development</p>
      </div>

      <div className="flex items-center gap-4">
        <Bell className="text-gray-400 hover:text-violet-400 cursor-pointer" />
        <UserCircle className="text-gray-400 hover:text-violet-400 cursor-pointer" size={28} />
      </div>
    </header>
  );
}