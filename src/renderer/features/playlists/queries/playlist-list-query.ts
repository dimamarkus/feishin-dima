import type { QueryOptions } from '/@/renderer/lib/react-query';
import type { PlaylistListQuery } from '/@/shared/types/domain-types';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';

export const usePlaylistList = (args: {
    options?: QueryOptions;
    query: PlaylistListQuery;
    serverId?: string;
}) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        cacheTime: 1000 * 60 * 60,
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getPlaylistList({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.playlists.list(server?.id || '', query),
        ...options,
    });
};
