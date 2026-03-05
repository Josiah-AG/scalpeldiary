interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'blue';
  showTagline?: boolean;
}

export default function Logo({ className = '', size = 'md', color = 'white', showTagline = false }: LogoProps) {
  const sizeMap = {
    sm: { icon: 24, text: 'text-lg', tagline: 'text-[8px]' },
    md: { icon: 32, text: 'text-xl', tagline: 'text-[10px]' },
    lg: { icon: 48, text: 'text-3xl', tagline: 'text-xs' }
  };

  const colorClasses = {
    white: { text: 'text-white', tagline: 'text-blue-100' },
    blue: { text: 'text-blue-600', tagline: 'text-blue-400' }
  };

  const dimensions = sizeMap[size];
  const colors = colorClasses[color];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="/favicon2.svg" 
        alt="ScalpelDiary Logo" 
        width={dimensions.icon} 
        height={dimensions.icon}
        className="flex-shrink-0"
      />
      <div>
        <div className={`font-bold ${dimensions.text} ${colors.text} leading-tight`}>
          ScalpelDiary
        </div>
        {showTagline && (
          <div className={`${dimensions.tagline} ${colors.tagline} leading-tight`}>
            Shaping Tomorrow's Surgeons
          </div>
        )}
      </div>
    </div>
  );
}
