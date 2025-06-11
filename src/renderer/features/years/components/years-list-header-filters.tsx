import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Divider, Flex, Group, Slider, Stack, Switch } from '@mantine/core';
import { ChangeEvent, MouseEvent, MutableRefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RiMoreFill, RiRefreshLine, RiSettings3Fill } from 'react-icons/ri';

import { YEAR_PLAYLISTS } from '../years-playlists';

import i18n from '/@/i18n/i18n';
import { Button, DropdownMenu, MultiSelect, Text } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { useListStoreActions, useListStoreByKey } from '/@/renderer/store';
import { SortOrder } from '/@/shared/types/domain-types';
import { LibraryItem, YearListQuery } from '/@/shared/types/domain-types';
import { ListDisplayType, TableColumn } from '/@/shared/types/types';

// Define year sort options
const YEAR_FILTERS = [
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.name', { postProcess: 'titleCase' }),
        value: 'name',
    },
    {
        defaultOrder: SortOrder.DESC,
        name: i18n.t('filter.year', { postProcess: 'titleCase' }),
        value: 'year',
    },
    {
        defaultOrder: SortOrder.ASC,
        name: i18n.t('filter.type', { postProcess: 'titleCase' }),
        value: 'type',
    },
];

// Define year table columns - using standard columns that make sense for years
const YEAR_TABLE_COLUMNS = [
    {
        label: 'Row Index',
        value: TableColumn.ROW_INDEX,
    },
    {
        label: 'Title',
        value: TableColumn.TITLE,
    },
    {
        label: 'Actions',
        value: TableColumn.ACTIONS,
    },
];

interface YearsListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const YearsListHeaderFilters = ({
    gridRef,
    itemCount,
    tableRef,
}: YearsListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const { customFilters, pageKey } = useListContext();
    const { setDisplayType, setFilter, setGrid, setTable } = useListStoreActions();
    const { display, filter, grid, table } = useListStoreByKey({ key: pageKey });
    const cq = useContainerQuery();

    // Provide default values to prevent crashes
    const safeFilter = filter || {};
    const safeGrid = grid || {};
    const safeTable = table || {};
    const safeDisplay = display || 'card';

    const sortByLabel =
        YEAR_FILTERS.find((f) => f.value === (safeFilter as any)?.sortBy)?.name || 'Name';

    const isGrid = safeDisplay === ListDisplayType.CARD || safeDisplay === ListDisplayType.POSTER;

    const handleRefresh = useCallback(() => {
        // Refresh by forcing re-render - years are static data
        window.location.reload();
    }, []);

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;

            const sortOrder = YEAR_FILTERS.find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            setFilter({
                customFilters,
                data: {
                    sortBy: e.currentTarget.value as any,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: 'year' as any,
                key: pageKey,
            });
        },
        [customFilters, pageKey, setFilter],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;

        setFilter({
            customFilters,
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.YEAR,
            key: pageKey,
        });
    }, [customFilters, filter.sortOrder, pageKey, setFilter]);

    const handleItemSize = (e: number) => {
        if (isGrid) {
            setGrid({ data: { itemSize: e }, key: pageKey });
        } else {
            setTable({ data: { rowHeight: e }, key: pageKey });
        }
    };

    const handleItemGap = (e: number) => {
        setGrid({ data: { itemGap: e }, key: pageKey });
    };

    const handleSetViewType = useCallback(
        (e: any) => {
            if (!e) return;

            const view = e.currentTarget.value as ListDisplayType;
            setDisplayType({ data: view, key: pageKey });
        },
        [pageKey, setDisplayType],
    );

    const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
        setTable({ data: { autoFit: e.currentTarget.checked }, key: pageKey });

        if (e.currentTarget.checked) {
            tableRef.current?.api.sizeColumnsToFit();
        }
    };

    const handleTableColumns = (values: TableColumn[]) => {
        const existingColumns = safeTable.columns || [];

        if (values.length === 0) {
            return setTable({
                data: { columns: [] },
                key: pageKey,
            });
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = { column: values[values.length - 1], width: 100 };

            setTable({ data: { columns: [...existingColumns, newColumn] }, key: pageKey });
        } else {
            // If removing a column
            const removed = existingColumns.filter((column) => !values.includes(column.column));
            const newColumns = existingColumns.filter((column) => !removed.includes(column));

            setTable({ data: { columns: newColumns }, key: pageKey });
        }

        return tableRef.current?.api.sizeColumnsToFit();
    };

    // Type filter handling
    const currentTypeFilter = (filter._custom as any)?.typeFilter || 'all';

    const handleSetTypeFilter = useCallback(
        (e: any) => {
            if (!e) return;

            const typeFilter = e.currentTarget.value;
            setFilter({
                customFilters,
                data: {
                    _custom: {
                        ...filter._custom,
                        typeFilter,
                    },
                },
                itemType: LibraryItem.YEAR,
                key: pageKey,
            });
        },
        [customFilters, filter._custom, pageKey, setFilter],
    );

    const typeFilterLabel =
        currentTypeFilter === 'decades'
            ? 'Decades Only'
            : currentTypeFilter === 'years'
              ? 'Years Only'
              : 'All Years';

    return (
        <Flex justify="space-between">
            <Group
                ref={cq.ref}
                spacing="sm"
                w="100%"
            >
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            compact
                            fw={600}
                            size="md"
                            variant="subtle"
                        >
                            {typeFilterLabel}
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            $isActive={currentTypeFilter === 'all'}
                            onClick={handleSetTypeFilter}
                            value="all"
                        >
                            All Years
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={currentTypeFilter === 'decades'}
                            onClick={handleSetTypeFilter}
                            value="decades"
                        >
                            Decades Only
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={currentTypeFilter === 'years'}
                            onClick={handleSetTypeFilter}
                            value="years"
                        >
                            Years Only
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <Divider orientation="vertical" />
                <OrderToggleButton
                    onToggle={handleToggleSortOrder}
                    sortOrder={filter.sortOrder}
                />
                <Button
                    compact
                    onClick={handleRefresh}
                    size="md"
                    tooltip={{ label: t('common.refresh', { postProcess: 'titleCase' }) }}
                    variant="subtle"
                >
                    <RiRefreshLine size="1.3rem" />
                </Button>
                <Divider orientation="vertical" />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            compact
                            size="md"
                            variant="subtle"
                        >
                            <RiMoreFill size={15} />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            icon={<RiRefreshLine />}
                            onClick={handleRefresh}
                        >
                            {t('common.refresh', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <Group
                noWrap
                spacing="sm"
            >
                <DropdownMenu
                    position="bottom-end"
                    width={425}
                >
                    <DropdownMenu.Target>
                        <Button
                            compact
                            size="md"
                            tooltip={{
                                label: t('common.configure', { postProcess: 'titleCase' }),
                            }}
                            variant="subtle"
                        >
                            <RiSettings3Fill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Label>
                            {t('table.config.general.displayType', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item
                            $isActive={safeDisplay === ListDisplayType.CARD}
                            onClick={handleSetViewType}
                            value={ListDisplayType.CARD}
                        >
                            {t('table.config.view.card', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={safeDisplay === ListDisplayType.POSTER}
                            onClick={handleSetViewType}
                            value={ListDisplayType.POSTER}
                        >
                            {t('table.config.view.poster', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={safeDisplay === ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                            value={ListDisplayType.TABLE}
                        >
                            {t('table.config.view.table', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>
                            {t('table.config.general.size', { postProcess: 'titleCase' })}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item closeMenuOnClick={false}>
                            <Slider
                                defaultValue={
                                    isGrid ? safeGrid?.itemSize || 200 : safeTable.rowHeight || 50
                                }
                                max={isGrid ? 300 : 100}
                                min={isGrid ? 100 : 25}
                                onChangeEnd={handleItemSize}
                            />
                        </DropdownMenu.Item>
                        {isGrid && (
                            <>
                                <DropdownMenu.Label>
                                    {t('table.config.general.itemGap', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </DropdownMenu.Label>
                                <DropdownMenu.Item closeMenuOnClick={false}>
                                    <Slider
                                        defaultValue={safeGrid?.itemGap || 16}
                                        max={30}
                                        min={0}
                                        onChangeEnd={handleItemGap}
                                    />
                                </DropdownMenu.Item>
                            </>
                        )}
                        {(safeDisplay === ListDisplayType.TABLE ||
                            safeDisplay === ListDisplayType.TABLE_PAGINATED) && (
                            <>
                                <DropdownMenu.Label>
                                    {t('table.config.general.tableColumns', {
                                        postProcess: 'titleCase',
                                    })}
                                </DropdownMenu.Label>
                                <DropdownMenu.Item
                                    closeMenuOnClick={false}
                                    component="div"
                                    sx={{ cursor: 'default' }}
                                >
                                    <Stack>
                                        <MultiSelect
                                            clearable
                                            data={YEAR_TABLE_COLUMNS}
                                            defaultValue={safeTable?.columns?.map(
                                                (column) => column.column,
                                            )}
                                            onChange={handleTableColumns}
                                            width={300}
                                        />
                                        <Group position="apart">
                                            <Text>
                                                {t('table.config.general.autoFitColumns', {
                                                    postProcess: 'titleCase',
                                                })}
                                            </Text>
                                            <Switch
                                                defaultChecked={safeTable.autoFit || true}
                                                onChange={handleAutoFitColumns}
                                            />
                                        </Group>
                                    </Stack>
                                </DropdownMenu.Item>
                            </>
                        )}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
        </Flex>
    );
};
