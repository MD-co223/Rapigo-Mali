'use client';

import Image from 'next/image';

interface RapigoLogoProps {
  variant: 'horizontal' | 'vertical' | 'icon' | 'white' | 'transparent';
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

const VARIANT_SRC: Record<RapigoLogoProps['variant'], string> = {
  horizontal: '/logo-horizontal.png',
  vertical: '/logo-vertical.png',
  icon: '/logo-icon.png',
  white: '/logo-white.png',
  transparent: '/logo-transparent.png',
};

const VARIANT_ASPECT: Record<RapigoLogoProps['variant'], string> = {
  horizontal: '3 / 1',
  vertical: '1 / 1',
  icon: '1 / 1',
  white: '3 / 1',
  transparent: '3 / 1',
};

export function RapigoLogo({
  variant,
  height = 36,
  className = '',
  alt = 'Rapigo Mali',
  priority = false,
}: RapigoLogoProps) {
  return (
    <div
      style={{ height, maxHeight: height, minHeight: height, aspectRatio: VARIANT_ASPECT[variant] }}
      className={`relative overflow-hidden flex-shrink-0 ${className}`}
    >
      <Image
        src={VARIANT_SRC[variant]}
        alt={alt}
        fill
        className="!relative !h-full !w-auto object-contain object-center"
        unoptimized
        priority={priority}
      />
    </div>
  );
}
