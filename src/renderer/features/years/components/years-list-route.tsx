import { useMemo, useRef } from 'react';

import { YEAR_PLAYLISTS } from '../years-playlists';
import { YearsListContent } from './years-list-content';

import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ListContext } from '/@/renderer/context/list-context';
import { AnimatedPage } from '/@/renderer/features/shared';

const YearsListRoute = () => {
    const gridRef = useRef<null | VirtualInfiniteGridRef>(null);
    const tableRef = useRef<any>(null);

    const providerValue = useMemo(
        () => ({
            pageKey: 'label' as any, // Use 'label' since it has similar structure and we don't have 'year' in the store
        }),
        [],
    );

    return (
        <AnimatedPage>
            <ListContext.Provider value={providerValue}>
                <YearsListContent itemCount={YEAR_PLAYLISTS.length} />
            </ListContext.Provider>
        </AnimatedPage>
    );
};

export default YearsListRoute;
