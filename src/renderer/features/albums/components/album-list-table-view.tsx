import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable } from '/@/renderer/components/virtual-table';
import { useVirtualTable } from '/@/renderer/components/virtual-table/hooks/use-virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { ALBUM_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useCurrentServer } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';

export const AlbumListTableView = ({ itemCount, tableRef }: any) => {
    const server = useCurrentServer();
    const { customFilters, id, pageKey } = useListContext();

    const tableProps = useVirtualTable({
        contextMenu: ALBUM_CONTEXT_MENU_ITEMS,
        customFilters,
        isSearchParams: Boolean(id),
        itemCount,
        itemType: LibraryItem.ALBUM,
        pageKey,
        server,
        tableRef,
    });

    return (
        <VirtualGridAutoSizerContainer>
            <VirtualTable
                // https://github.com/ag-grid/ag-grid/issues/5284
                // Key is used to force remount of table when display, rowHeight, or server changes
                key={`table-${tableProps.rowHeight}-${server?.id}`}
                ref={tableRef}
                {...tableProps}
            />
        </VirtualGridAutoSizerContainer>
    );
};
