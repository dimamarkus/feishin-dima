import { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualLabelAPI } from '/@/renderer/features/labels/api/virtual-label-api';
import { ServerListItem } from '/@/shared/types/domain-types';

/**
 * Prefetch labels data to prevent UI blocking on initial load
 */
export const prefetchLabelsData = async (queryClient: QueryClient, server: ServerListItem) => {
    const labelQuery = { limit: 50, offset: 0 };
    const queryKey = queryKeys.labels.list(server.id, labelQuery);

    // Only prefetch if not already cached
    const existingData = queryClient.getQueryData(queryKey);
    if (!existingData) {
        queryClient.prefetchQuery({
            cacheTime: 1000 * 60 * 60, // 1 hour
            queryFn: async ({ signal }) => {
                return VirtualLabelAPI.getLabelList({
                    apiClientProps: { server, signal },
                    query: labelQuery,
                });
            },
            queryKey,
            staleTime: 1000 * 60 * 15, // 15 minutes
        });
    }
};

/**
 * Optimized image loading with size hints and loading priorities
 */
export const optimizeImageLoading = (
    imageElement: HTMLImageElement,
    priority: 'high' | 'low' = 'low',
) => {
    if ('loading' in imageElement) {
        imageElement.loading = priority === 'high' ? 'eager' : 'lazy';
    }

    if ('fetchPriority' in imageElement) {
        (imageElement as any).fetchPriority = priority;
    }

    // Add decoding hint for better performance
    if ('decoding' in imageElement) {
        imageElement.decoding = 'async';
    }
};

/**
 * Create responsive image URLs with appropriate sizes
 */
export const createResponsiveImageUrl = (baseUrl: string, containerSize: number) => {
    // Use device pixel ratio for better quality on high-DPI screens
    const pixelRatio = window.devicePixelRatio || 1;
    const targetSize = Math.min(containerSize * pixelRatio, 1000); // Cap at 1000px

    return baseUrl
        .replace(/&size=\d+/, `&size=${targetSize}`)
        .replace(/\?width=\d+/, `?width=${targetSize}`)
        .replace(/&height=\d+/, `&height=${targetSize}`);
};

/**
 * Debounced scroll handler for better performance
 */
export const createOptimizedScrollHandler = (callback: Function, delay: number = 16) => {
    let timeoutId: NodeJS.Timeout;
    let isScrolling = false;

    return (...args: any[]) => {
        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(() => {
                callback(...args);
                isScrolling = false;
            });
        }

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

/**
 * Memory-conscious image cache management
 */
export class ImageCacheManager {
    private static cache = new Map<string, { timestamp: number; url: string }>();
    private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
    private static readonly MAX_CACHE_SIZE = 200;

    static cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }

    static clear(): void {
        this.cache.clear();
    }

    static get(key: string): null | string {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if cache item is still valid
        if (Date.now() - item.timestamp > this.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }

        return item.url;
    }

    static set(key: string, url: string): void {
        // Remove oldest items if cache is full
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            timestamp: Date.now(),
            url,
        });
    }
}

// Auto-cleanup image cache every 10 minutes
if (typeof window !== 'undefined') {
    setInterval(
        () => {
            ImageCacheManager.cleanup();
        },
        1000 * 60 * 10,
    );
}
