import { Link } from 'react-router-dom';
import Navigation from './NavBarLanding';

const features = [
  {
    title: 'Secure & Simple',
    subtitle: 'For everyday users',
    description: 'Manage, send, and receive digital assets effortlessly. No technical knowledge required—just security and simplicity at your fingertips.',
    img: './src/assets/landing/1.png',
  },
  {
    title: 'Speed & Insights',
    subtitle: 'For active traders',
    description: 'Real-time price tracking, instant transactions, and live market data. Stay ahead of every move with a high-speed trading experience.',
    img: './src/assets/landing/2.png',
  },
  {
    title: 'Institutional Grade',
    subtitle: 'For organizations',
    description: 'Multi-signature wallets, detailed transaction history, and advanced portfolio tools—maximum security and compliance for high-value portfolios.',
    img: './src/assets/landing/3.png',
  },
];

const stats = [
  { label: 'Supported assets', value: '50+' },
  { label: 'Real-time streams', value: '24/7' },
  { label: 'Transaction types', value: '4' },
  { label: 'Security layers', value: 'MFA' },
];

const LandingPage = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden pt-20">
        {/* glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-[#F0E7A1]/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block text-xs font-medium tracking-widest text-[#F0E7A1]/60 uppercase mb-6 border border-[#F0E7A1]/20 px-4 py-1.5 rounded-full">
            Crypto wallet platform
          </span>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            The future of{' '}
            <span className="text-[#F0E7A1]">secure crypto</span>{' '}
            management
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10">
            Better Wallet gives you complete control over your digital assets — from everyday spending to institutional-grade portfolio management.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/Register">
              <button className="px-8 py-3.5 bg-[#F0E7A1] text-black font-semibold rounded-xl hover:bg-[#F0E7A1]/90 transition-colors text-base">
                Create your wallet
              </button>
            </Link>
            <Link to="/Login">
              <button className="px-8 py-3.5 border border-[#F0E7A1]/30 text-[#F0E7A1] font-medium rounded-xl hover:bg-[#F0E7A1]/10 transition-colors text-base">
                Sign in
              </button>
            </Link>
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="border-y border-[#F0E7A1]/10 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-[#F0E7A1]">{s.value}</div>
              <div className="text-sm text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for every type of investor</h2>
            <p className="text-white/40 max-w-xl mx-auto">Whether you're just starting out or managing a portfolio at scale, Better Wallet adapts to your needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#F0E7A1]/3 border border-[#F0E7A1]/10 rounded-2xl p-6 hover:border-[#F0E7A1]/30 transition-colors group"
              >
                <div className="h-48 rounded-xl overflow-hidden mb-6 bg-black/40">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xs text-[#F0E7A1]/50 font-medium tracking-widest uppercase mb-2">{f.subtitle}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-[#F0E7A1]/5 border border-[#F0E7A1]/15 rounded-3xl px-10 py-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to take control?</h2>
            <p className="text-white/40 mb-8">Join Better Wallet and start managing your crypto with confidence.</p>
            <Link to="/Register">
              <button className="px-8 py-3.5 bg-[#F0E7A1] text-black font-semibold rounded-xl hover:bg-[#F0E7A1]/90 transition-colors">
                Get started for free
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#F0E7A1]/10 py-8 px-6 text-center text-white/20 text-sm">
        &copy; {new Date().getFullYear()} Better Wallet. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
