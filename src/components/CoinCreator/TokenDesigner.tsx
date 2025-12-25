'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Twitter, Send, Globe, ImagePlus, Sparkles } from 'lucide-react';
import type { MockToken } from '@/lib/bonding-curve';
import { createMockToken } from '@/lib/bonding-curve';

interface TokenDesignerProps {
  onTokenCreated: (token: MockToken) => void;
}

export function TokenDesigner({ onTokenCreated }: TokenDesignerProps) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!name.trim() || !symbol.trim()) return;

    const token = createMockToken(
      name.trim(),
      symbol.trim(),
      description.trim(),
      logoPreview,
      { twitter, telegram, website }
    );

    onTokenCreated(token);
  };

  const isValid = name.trim().length > 0 && symbol.trim().length >= 2 && symbol.trim().length <= 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Token erstellen</h2>
          <p className="text-sm text-gray-400">Simuliere deinen eigenen Memecoin</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
        <p className="text-xs text-yellow-400">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Dies ist eine SIMULATION zu Lernzwecken. Keine echte Blockchain-Transaktion!
        </p>
      </div>

      <div className="space-y-4">
        {/* Logo Upload */}
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden hover:border-yellow-500 transition-colors">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </label>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Token Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Doge Coin"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            maxLength={32}
          />
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Symbol (2-8 Zeichen) *</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="z.B. DOGE"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors font-mono"
            maxLength={8}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Worum geht es bei deinem Token?"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
            rows={3}
            maxLength={256}
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <Twitter className="w-3 h-3" /> Twitter
            </label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="@handle"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <Send className="w-3 h-3" /> Telegram
            </label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="t.me/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <Globe className="w-3 h-3" /> Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>
        </div>

        {/* Create Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          disabled={!isValid}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
            isValid
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg hover:shadow-yellow-500/25'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Rocket className="w-5 h-5 inline mr-2" />
          Token erstellen
        </motion.button>
      </div>
    </motion.div>
  );
}
