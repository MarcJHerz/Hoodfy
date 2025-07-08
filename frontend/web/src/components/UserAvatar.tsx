import React from 'react';
import Image from 'next/image';
import { platform } from '../config/platform';
import { theme } from '../theme';
import { useImageUrl } from '@/utils/useImageUrl';

interface UserAvatarProps {
  size: number;
  source?: string;
  name: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ size, source, name }) => {
  const { url, loading } = useImageUrl(source);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="flex justify-center items-center overflow-hidden bg-primary-50 dark:bg-primary-900/20"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        position: 'relative'
      }}
    >
      {source && !loading ? (
        <Image
          src={url}
          alt={name}
          fill
          className="object-cover"
          sizes={`${size}px`}
          unoptimized
        />
      ) : (
        <span
          className="text-primary-600 dark:text-primary-400 font-semibold"
          style={{
            fontSize: size * 0.4,
          }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}; 