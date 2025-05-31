import { useQuery } from '@tanstack/react-query';

import { LabelListQuery, VirtualLabelAPI } from '../api/virtual-label-api';

import { useCurrentServer } from '/@/renderer/store';

type UseLabelListArgs = {
    options?: {
        cacheTime?: number;
        enabled?: boolean;
        staleTime?: number;
    };
    query?: LabelListQuery;
};

export const useLabelList = (args: UseLabelListArgs) => {
    const { options, query } = args;
    const server = useCurrentServer();

    return useQuery({
        cacheTime: options?.cacheTime,
        enabled: Boolean(server && options?.enabled !== false),
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not available');

            // Add timeout to prevent hanging
            const timeoutId = setTimeout(() => {
                if (signal && !signal.aborted) {
                    console.warn('Label query timeout after 30 seconds');
                }
            }, 30000);

            const promise = VirtualLabelAPI.getLabelList({
                apiClientProps: { server, signal },
                query,
            });

            promise.finally(() => clearTimeout(timeoutId));

            return promise;
        },
        queryKey: ['labels', 'list', server?.id || 'no-server', query],
        retry: 2, // Retry failed queries up to 2 times
        retryDelay: 1000, // Wait 1 second between retries
        staleTime: options?.staleTime,
    });
};
