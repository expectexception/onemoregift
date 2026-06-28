'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function AnimatedImage({ src, alt, fill, width, height, className, unoptimized, priority, ...props }) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Extract rounded classes for the wrapper to ensure clipping and shimmer match the image shape
    const roundedClass = className?.split(' ').filter(c => c.startsWith('rounded')).join(' ') || '';

    return (
        <div className={`relative overflow-hidden w-full h-full bg-neutral-950/60 ${!isLoaded ? 'animate-pulse' : ''} ${roundedClass}`}>
            {/* Shimmer overlay when loading */}
            {!isLoaded && (
                <div className="absolute inset-0 z-10 pointer-events-none shimmer-bg" />
            )}
            
            <Image
                src={src}
                alt={alt || ''}
                fill={fill}
                width={width}
                height={height}
                priority={priority}
                unoptimized={unoptimized}
                onLoad={() => setIsLoaded(true)}
                className={`
                    transition-all duration-700 ease-out
                    ${fill ? 'absolute inset-0 w-full h-full' : ''}
                    ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-[8px] scale-95'}
                    ${className || ''}
                `}
                {...props}
            />
        </div>
    );
}
