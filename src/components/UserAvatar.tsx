import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { User, AccountType } from '../types';

interface UserAvatarProps {
  user?: User | null;
  src?: string;
  name?: string;
  role?: AccountType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name,
  role,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const imageSrc = src || user?.profileImage;
  const displayName = name || user?.fullName || user?.businessName || 'User';
  const displayRole = role || user?.accountType || 'buyer';

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-24 h-24 text-2xl font-bold',
  }[size];

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 24,
    xl: 32,
    '2xl': 40,
  }[size];

  // Role color accents
  const roleBg = {
    admin: 'bg-gradient-to-tr from-[#0B172E] to-[#E6007E] text-white',
    seller: 'bg-[#E6007E] text-white',
    buyer: 'bg-[#0B172E] text-white',
  }[displayRole] || 'bg-slate-700 text-white';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'KK';

  return (
    <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
      {imageSrc && !imageError ? (
        <img
          src={imageSrc}
          alt={displayName}
          onError={() => setImageError(true)}
          className={`${sizeClasses} rounded-full object-cover border-2 border-white/80 shadow-sm bg-slate-100`}
        />
      ) : (
        <div
          className={`${sizeClasses} ${roleBg} rounded-full flex items-center justify-center font-medium shadow-sm border-2 border-white/80`}
          title={displayName}
        >
          {initials.length > 0 ? (
            <span>{initials}</span>
          ) : (
            <UserIcon size={iconSizes} className="opacity-90" />
          )}
        </div>
      )}

      {showBadge && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            displayRole === 'admin'
              ? 'bg-[#E6007E]'
              : displayRole === 'seller'
              ? 'bg-emerald-500'
              : 'bg-blue-500'
          }`}
          title={`${displayRole.toUpperCase()}`}
        />
      )}
    </div>
  );
};
