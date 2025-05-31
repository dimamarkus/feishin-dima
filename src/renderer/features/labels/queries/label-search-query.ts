import { useQuery } from '@tanstack/react-query';

import { LabelListQuery, VirtualLabelAPI } from '../api/virtual-label-api';

import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';

export const useLabelSearch = ({ options, query, serverId }: QueryHookArgs<LabelListQuery>) => {
    const server = useCurrentServer();

    return useQuery({
        ...options,
        queryFn: ({ signal }) =>
            VirtualLabelAPI.getLabelList({
                apiClientProps: { server, signal },
                query,
            }),
        queryKey: queryKeys.labels.search(serverId || '', query),
    });
};
