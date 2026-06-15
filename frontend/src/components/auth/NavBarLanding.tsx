import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/80 backdrop-blur-md border-b border-[#F0E7A1]/10">
      <Link to="/">
        <Logo size="sm" />
      </Link>

      <ul className="hidden md:flex items-center gap-8 text-sm text-[#F0E7A1]/60">
        <li><a href="#features" className="hover:text-[#F0E7A1] transition-colors">Features</a></li>
        <li><a href="#features" className="hover:text-[#F0E7A1] transition-colors">Individuals</a></li>
        <li><a href="#features" className="hover:text-[#F0E7A1] transition-colors">Traders</a></li>
        <li><a href="#features" className="hover:text-[#F0E7A1] transition-colors">Institutional</a></li>
      </ul>

      <div className="flex items-center gap-3">
        <Link to="/Login">
          <button className="px-4 py-2 text-sm text-[#F0E7A1] border border-[#F0E7A1]/30 rounded-lg hover:bg-[#F0E7A1]/10 transition-colors">
            Sign in
          </button>
        </Link>
        <Link to="/Register">
          <button className="px-4 py-2 text-sm bg-[#F0E7A1] text-black rounded-lg hover:bg-[#F0E7A1]/90 transition-colors font-medium">
            Get started
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
