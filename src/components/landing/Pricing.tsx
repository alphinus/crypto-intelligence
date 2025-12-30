'use client';

import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Building } from 'lucide-react';
import Link from 'next/link';

interface PricingTier {
    name: string;
    price: string;
    period: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    popular?: boolean;
    features: { text: string; included: boolean }[];
    cta: string;
    ctaLink: string;
}

const tiers: PricingTier[] = [
    {
        name: 'Free',
        price: '€0',
        period: 'für immer',
        description: 'Perfekt zum Kennenlernen',
        icon: Sparkles,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        features: [
            { text: 'Basis Dashboard', included: true },
            { text: 'Fear & Greed Index', included: true },
            { text: '1 Signal pro Woche', included: true },
            { text: 'ETF Flow Preview', included: true },
            { text: 'Signal Historie (7 Tage)', included: true },
            { text: 'Alle Timeframes', included: false },
            { text: 'Echtzeit-Signale', included: false },
            { text: 'Smart DCA vollständig', included: false },
            { text: 'API-Zugang', included: false },
        ],
        cta: 'Kostenlos starten',
        ctaLink: '/app',
    },
    {
        name: 'Pro',
        price: '€19',
        period: '/Monat',
        description: 'Für aktive Trader',
        icon: Zap,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        popular: true,
        features: [
            { text: 'Alles aus Free', included: true },
            { text: 'Alle Signale (5-10/Woche)', included: true },
            { text: 'Signal Confidence Details', included: true },
            { text: 'ETF Flow vollständig', included: true },
            { text: 'Signal Historie unbegrenzt', included: true },
            { text: 'Smart DCA vollständig', included: true },
            { text: 'Email-Alerts', included: true },
            { text: 'Priority Support', included: true },
            { text: 'API-Zugang', included: false },
        ],
        cta: 'Pro werden',
        ctaLink: '/signup?plan=pro',
    },
    {
        name: 'Enterprise',
        price: '€49',
        period: '/Monat',
        description: 'Für Profis & Teams',
        icon: Building,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        features: [
            { text: 'Alles aus Pro', included: true },
            { text: 'Echtzeit-Signale (<1 Min)', included: true },
            { text: 'Telegram/Discord Bot', included: true },
            { text: 'API-Zugang', included: true },
            { text: 'Whale Tracker', included: true },
            { text: 'Custom Alerts', included: true },
            { text: 'Portfolio Tracking', included: true },
            { text: 'White-Label Option', included: true },
            { text: 'Dedicated Support', included: true },
        ],
        cta: 'Enterprise starten',
        ctaLink: '/signup?plan=enterprise',
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Wähle deinen Plan
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Starte kostenlos und upgrade jederzeit. Keine versteckten Kosten.
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {tiers.map((tier, index) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col p-6 rounded-2xl border ${tier.popular
                                    ? 'bg-gradient-to-b from-blue-950/50 to-gray-900 border-blue-500/50'
                                    : 'bg-gray-900/50 border-gray-800'
                                }`}
                        >
                            {/* Popular Badge */}
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                                        Beliebteste Wahl
                                    </span>
                                </div>
                            )}

                            {/* Header */}
                            <div className="mb-6">
                                <div className={`w-12 h-12 rounded-xl ${tier.bgColor} flex items-center justify-center mb-4`}>
                                    <tier.icon className={`w-6 h-6 ${tier.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                                <p className="text-sm text-gray-500">{tier.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">{tier.price}</span>
                                <span className="text-gray-500">{tier.period}</span>
                            </div>

                            {/* Features */}
                            <ul className="flex-1 space-y-3 mb-6">
                                {tier.features.map((feature) => (
                                    <li key={feature.text} className="flex items-start gap-2">
                                        {feature.included ? (
                                            <Check className="w-5 h-5 text-green-400 shrink-0" />
                                        ) : (
                                            <X className="w-5 h-5 text-gray-600 shrink-0" />
                                        )}
                                        <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link
                                href={tier.ctaLink}
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-center transition-all ${tier.popular
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                {tier.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Money back guarantee */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-gray-500 text-sm mt-8"
                >
                    ✓ 14 Tage Geld-zurück-Garantie • ✓ Jederzeit kündbar • ✓ Kein Abo-Zwang
                </motion.p>
            </div>
        </section>
    );
}
