'use client';

import Image, { type ImageProps } from 'next/image';

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string;
};

export default function SafeImage({ src, alt, ...props }: SafeImageProps) {
  return <Image {...props} alt={alt} src={src} />;
}
