'use client';

import { motion } from 'framer-motion';
import { Brain, BarChart3, Building2, Target, Zap, Clock, Shield, TrendingUp } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'KI-Analyse',
        description: 'Fortschrittliche Multi-Timeframe Analyse mit maschinellem Lernen für präzise Signale.',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
    },
    {
        icon: BarChart3,
        title: 'Signal Confidence',
        description: 'Transparenter Score zeigt genau, warum ein Signal stark oder schwach ist.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: Building2,
        title: 'ETF Flow Tracking',
        description: 'Verfolge institutionelle Kapitalflüsse in Bitcoin und Ethereum Spot ETFs.',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
    },
    {
        icon: Target,
        title: 'Smart DCA',
        description: 'Optimierte Kaufzonen mit dynamischer Budget-Empfehlung basierend auf Marktlage.',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
    },
    {
        icon: Clock,
        title: 'Echtzeit-Daten',
        description: 'Live WebSocket-Verbindung für sofortige Preisupdates und Signalbenachrichtigungen.',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
    },
    {
        icon: TrendingUp,
        title: 'Signal Historie',
        description: 'Vollständige Nachverfolgung aller Signale mit Win-Rate und Performance-Statistiken.',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 px-4 bg-gray-950">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Alles was du brauchst
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Professionelle Trading-Tools, verständlich aufbereitet für jeden Erfahrungslevel.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group p-6 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all hover:bg-gray-900/80"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
