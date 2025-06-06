import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { RowDoubleClickedEvent } from '@ag-grid-community/core';
import { MutableRefObject } from 'react';

import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useAppFocus } from '/@/renderer/hooks';
import {
    useCurrentServer,
    useCurrentSong,
    useCurrentStatus,
    usePlayButtonBehavior,
} from '/@/renderer/store';
import { LibraryItem, QueueSong, SongListQuery } from '/@/shared/types/domain-types';

interface SongListTableViewProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListTableView = ({ itemCount, tableRef }: SongListTableViewProps) => {
    const server = useCurrentServer();
    const { customFilters, handlePlay, id, pageKey } = useListContext();
    const isFocused = useAppFocus();
    const currentSong = useCurrentSong();
    const status = useCurrentStatus();

    const { rowClassRules } = useCurrentSongRowStyles({ tableRef });

    const tableProps = useVirtualTable<SongListQuery>({
        columnType: 'generic',
        contextMenu: SONG_CONTEXT_MENU_ITEMS,
        customFilters,
        isSearchParams: Boolean(id),
        itemCount,
        itemType: LibraryItem.SONG,
        pageKey,
        server,
        tableRef,
    });

    const playButtonBehavior = usePlayButtonBehavior();
    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;
        handlePlay?.({ initialSongId: e.data.id, playType: playButtonBehavior });
    };

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
                context={{
                    ...tableProps.context,
                    currentSong,
                    isFocused,
                    status,
                }}
                onRowDoubleClicked={handleRowDoubleClick}
                rowClassRules={rowClassRules}
                shouldUpdateSong
            />
        </VirtualGridAutoSizerContainer>
    );
};
