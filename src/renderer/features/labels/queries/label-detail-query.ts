import { useQuery } from '@tanstack/react-query';

import { VirtualLabelAPI } from '../api/virtual-label-api';

import { useCurrentServer } from '/@/renderer/store';

type UseLabelDetailArgs = {
    labelId: string;
    options?: {
        cacheTime?: number;
        enabled?: boolean;
        staleTime?: number;
    };
    serverId?: string;
};

export const useLabelDetail = (args: UseLabelDetailArgs) => {
    const { labelId, options, serverId } = args;
    const server = useCurrentServer();

    return useQuery({
        cacheTime: options?.cacheTime || 1000 * 60 * 60, // Default 1 hour cache
        enabled: Boolean(server && serverId && labelId && options?.enabled !== false),
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not available');

            return VirtualLabelAPI.getLabelDetail({
                apiClientProps: { server, signal },
                labelId,
            });
        },
        queryKey: ['labels', 'detail', serverId, labelId],
        refetchOnWindowFocus: false, // Don't refetch on focus
        staleTime: options?.staleTime || 1000 * 60 * 15, // Default 15 minutes stale time
    });
};
