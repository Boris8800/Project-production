import dynamic from 'next/dynamic';

const PremiumTravelApp = dynamic(() => import('../components/premium-travel/PremiumTravelApp'), {
  ssr: false,
});

export default function HomePage() {
  return <PremiumTravelApp />;
}
