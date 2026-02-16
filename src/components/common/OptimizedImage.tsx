import React from 'react';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
}) => {
  return (
    <img src={src} alt={alt} className={className} width={width} height={height} loading="lazy" />
  );
};
