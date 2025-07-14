import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  href = '/dashboard',
  className = ''
}) => {
  // URL de tu logo personalizado (reemplaza con tu URL de S3)
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || '';
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const LogoContent = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {logoUrl ? (
          // Logo personalizado
          <Image
            src={logoUrl}
            alt="Qahood Logo"
            width={64}
            height={64}
            className="w-full h-full object-contain rounded-full"
            priority
          />
        ) : (
          // Logo por defecto con gradiente
          <div className={`w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-md`}>
            <span className="text-white font-bold text-sm">H</span>
          </div>
        )}
      </div>
      
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          Qahood
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

export default Logo; 