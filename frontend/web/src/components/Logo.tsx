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
  // URL directa del logo en S3
  const logoUrl = 'https://hoodfy-community-media.s3.us-east-1.amazonaws.com/public/hoodfy-logo.png';
  
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
        <Image
          src={logoUrl}
          alt="Hoodfy Logo"
          width={64}
          height={64}
          className="w-full h-full object-contain rounded-full"
          priority
          unoptimized
        />
      </div>
      
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent ${textSizes[size]}`}>
          Hoodfy
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