import { Hero, Features, Pricing, Footer } from '@/components/landing';

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-gray-950">
            <Hero />
            <Features />
            <Pricing />
            <Footer />
        </main>
    );
}

export const metadata = {
    title: 'Crypto Intelligence - KI-gestützte Crypto Signale',
    description: 'Professionelle Trading-Signale mit transparentem Confidence Score. Multi-Timeframe Analyse, ETF-Flows, Smart DCA.',
    openGraph: {
        title: 'Crypto Intelligence - KI-gestützte Crypto Signale',
        description: 'Professionelle Trading-Signale mit transparentem Confidence Score.',
        type: 'website',
    },
};
