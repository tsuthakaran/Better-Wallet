interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { box: 'w-6 h-6 text-sm rounded-md', text: 'text-sm' },
  md: { box: 'w-8 h-8 text-base rounded-lg', text: 'text-lg' },
  lg: { box: 'w-12 h-12 text-2xl rounded-xl', text: 'text-2xl' },
};

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-1 select-none ${className}`}>
      <div className={`${s.box} bg-[#F0E7A1] flex items-center justify-center font-black text-black leading-none flex-shrink-0`}>
        W
      </div>
      <span className={`${s.text} font-bold text-[#F0E7A1] tracking-tight leading-none`}>
        Better <span className="text-[#F0E7A1]/60 font-normal">Wallet</span>
      </span>
    </div>
  );
};
