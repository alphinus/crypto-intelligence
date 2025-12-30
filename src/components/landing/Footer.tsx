'use client';

import Link from 'next/link';
import { Brain, Twitter, Github, Mail } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-950 border-t border-gray-800 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-6 h-6 text-blue-500" />
                            <span className="text-lg font-bold text-white">Crypto Intelligence</span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-md mb-4">
                            KI-gestützte Marktanalyse für Crypto Trader. Professionelle Signale,
                            transparente Scores, nachvollziehbare Entscheidungen.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="mailto:support@cryptointel.de" className="text-gray-500 hover:text-gray-300 transition-colors">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Produkt</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#pricing" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Preise
                                </Link>
                            </li>
                            <li>
                                <Link href="/app" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    API Docs
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Rechtliches</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Impressum
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Datenschutz
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    AGB
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Risikohinweis
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © {currentYear} Crypto Intelligence. Alle Rechte vorbehalten.
                        </p>
                        <p className="text-gray-600 text-xs text-center md:text-right max-w-lg">
                            ⚠️ Risikohinweis: Kryptowährungen sind hochvolatil. Investiere nur, was du bereit bist zu verlieren.
                            Dies ist keine Finanzberatung.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
