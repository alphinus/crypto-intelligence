'use client';

import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

export function SettingsButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/settings')}
      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      title="Einstellungen"
    >
      <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
    </button>
  );
}
