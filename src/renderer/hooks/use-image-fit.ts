import { useEffect, useState } from 'react';

import { useSettingsStore } from '/@/renderer/store';

/**
 * Hook that provides image fit value with proper fallback and hydration handling
 */
export const useImageFit = () => {
    const nativeAspectRatio = useSettingsStore((store) => store.general.nativeAspectRatio);
    const [imageFit, setImageFit] = useState<'contain' | 'cover'>('cover');

    useEffect(() => {
        // Update image fit based on setting
        setImageFit(nativeAspectRatio ? 'contain' : 'cover');

        // Also update CSS custom property as backup
        const root = document.documentElement;
        root.style.setProperty('--image-fit', nativeAspectRatio ? 'contain' : 'cover');
    }, [nativeAspectRatio]);

    return imageFit;
};
