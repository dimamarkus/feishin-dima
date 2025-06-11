import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SimpleImg } from 'react-simple-img';
import styled from 'styled-components';

import {
    createResponsiveImageUrl,
    ImageCacheManager,
    optimizeImageLoading,
} from '/@/renderer/features/shared/utils/performance-utils';

const StyledImage = styled(SimpleImg)<{ $objectFit?: string }>`
    img {
        object-fit: ${({ $objectFit }) => $objectFit || 'var(--image-fit)'};
    }
`;

interface OptimizedImageProps {
    alt?: string;
    className?: string;
    height?: number | string;
    importance?: 'auto' | 'high' | 'low';
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    onError?: () => void;
    onLoad?: () => void;
    placeholder?: string;
    priority?: 'high' | 'low';
    src?: string;
    style?: React.CSSProperties;
    width?: number | string;
}

export const OptimizedImage = React.memo<OptimizedImageProps>(
    ({
        alt = 'image',
        className,
        height,
        importance = 'auto',
        objectFit,
        onError,
        onLoad,
        placeholder,
        priority = 'low',
        src,
        style,
        width,
        ...props
    }) => {
        const imageRef = useRef<HTMLImageElement>(null);
        const [optimizedSrc, setOptimizedSrc] = useState<string | undefined>(src);
        const [isLoaded, setIsLoaded] = useState(false);

        // Optimize image URL based on container size
        useEffect(() => {
            if (!src) {
                setOptimizedSrc(undefined);
                return;
            }

            const containerSize =
                typeof width === 'number' ? width : typeof height === 'number' ? height : 200; // Default size

            const cacheKey = `${src}-${containerSize}`;
            let cachedUrl = ImageCacheManager.get(cacheKey);

            if (!cachedUrl) {
                cachedUrl = createResponsiveImageUrl(src, containerSize);
                ImageCacheManager.set(cacheKey, cachedUrl);
            }

            setOptimizedSrc(cachedUrl);
        }, [src, width, height]);

        // Apply image loading optimizations
        useEffect(() => {
            if (imageRef.current && isLoaded) {
                optimizeImageLoading(imageRef.current, priority);
            }
        }, [isLoaded, priority]);

        const handleLoad = useCallback(() => {
            setIsLoaded(true);
            onLoad?.();
        }, [onLoad]);

        const handleError = useCallback(() => {
            onError?.();
        }, [onError]);

        // Forward ref to inner img element
        const handleRef = useCallback((element: HTMLElement | null) => {
            if (element) {
                const imgElement = element.querySelector('img');
                if (imgElement) {
                    imageRef.current = imgElement;
                }
            }
        }, []);

        return (
            <StyledImage
                $objectFit={objectFit}
                alt={alt}
                className={className}
                height={height}
                importance={importance}
                onError={handleError}
                onLoad={handleLoad}
                placeholder={placeholder}
                ref={handleRef}
                src={optimizedSrc}
                style={style}
                width={width}
                {...props}
            />
        );
    },
);

OptimizedImage.displayName = 'OptimizedImage';
