'use client';

import { useTheme } from 'next-themes';
import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

// This component assumes you have moved the logo files to the `public/images` directory.
// For example: `public/images/logo-dark.svg` and `public/images/logo-light.svg`

export function DevFestLogo(props: Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'>) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // To prevent a hydration mismatch and the wrong logo flashing,
    // we render a placeholder that respects the passed className,
    // which should define its size.
    return <div className={props.className} />;
  }

  const isDark = resolvedTheme === 'dark';
  const logoSrc = isDark ? '/images/logo-dark.svg' : '/images/logo-light.svg';

  return (
    <Image 
      src={logoSrc} 
      alt="DevFest Vizag Logo" 
      width={24} 
      height={24} 
      {...props} 
    />
  );
}
