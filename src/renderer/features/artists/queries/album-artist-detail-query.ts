import type { AlbumArtistDetailQuery } from '/@/shared/types/domain-types';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useAlbumArtistDetail = (args: QueryHookArgs<AlbumArtistDetailQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server?.id && !!query.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getAlbumArtistDetail({
                apiClientProps: { server, signal },
                query,
            });
        },
        queryKey: queryKeys.albumArtists.detail(server?.id || '', query),
        ...options,
    });
};
