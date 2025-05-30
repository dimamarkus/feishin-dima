import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import type { GenreListQuery } from '/@/shared/types/domain-types';

import { useQuery } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getServerById } from '/@/renderer/store';

export const useGenreList = (args: QueryHookArgs<GenreListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getGenreList({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.genres.list(server?.id || '', query),
        staleTime: 1000 * 5,
        ...options,
    });
};
