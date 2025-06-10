import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Flex, Group, Stack } from '@mantine/core';
import debounce from 'lodash/debounce';
import { ChangeEvent, MutableRefObject, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { YearsListHeaderFilters } from './years-list-header-filters';

import { PageHeader, SearchInput } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';

interface YearsListHeaderProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    onSearch?: (searchTerm: string) => void;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const YearsListHeader = ({
    gridRef,
    itemCount,
    onSearch,
    tableRef,
}: YearsListHeaderProps) => {
    const { t } = useTranslation();
    const cq = useContainerQuery();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setSearchTerm(value);
            onSearch?.(value);
        },
        [onSearch],
    );

    const debouncedHandleSearch = useMemo(() => debounce(handleSearch, 300), [handleSearch]);

    return (
        <Stack
            ref={cq.ref}
            spacing={0}
        >
            <PageHeader backgroundColor="var(--titlebar-bg)">
                <Flex
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.Title>{t('page.yearsList.title')}</LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput
                            defaultValue={searchTerm}
                            onChange={debouncedHandleSearch}
                            openedWidth={cq.isMd ? 250 : cq.isSm ? 200 : 150}
                            placeholder={t('common.search', { postProcess: 'sentenceCase' })}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <YearsListHeaderFilters
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
