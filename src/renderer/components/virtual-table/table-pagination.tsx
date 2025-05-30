import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { RiHashtag } from 'react-icons/ri';

import { Button } from '/@/renderer/components/button';
import { NumberInput } from '/@/renderer/components/input';
import { MotionFlex } from '/@/renderer/components/motion';
import { Pagination } from '/@/renderer/components/pagination';
import { Popover } from '/@/renderer/components/popover';
import { Text } from '/@/renderer/components/text';
import { useContainerQuery } from '/@/renderer/hooks';
import { ListKey } from '/@/renderer/store';
import { TablePagination as TablePaginationType } from '/@/shared/types/types';

interface TablePaginationProps {
    pageKey: ListKey;
    pagination: TablePaginationType;
    setIdPagination?: (id: string, pagination: Partial<TablePaginationType>) => void;
    setPagination?: (args: { data: Partial<TablePaginationType>; key: ListKey }) => void;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const TablePagination = ({
    pageKey,
    pagination,
    setIdPagination,
    setPagination,
    tableRef,
}: TablePaginationProps) => {
    const { t } = useTranslation();
    const [isGoToPageOpen, handlers] = useDisclosure(false);
    const containerQuery = useContainerQuery();

    const goToForm = useForm({
        initialValues: {
            pageNumber: undefined,
        },
    });

    const handlePagination = (index: number) => {
        const newPage = index - 1;
        tableRef.current?.api.paginationGoToPage(newPage);
        setPagination?.({ data: { currentPage: newPage }, key: pageKey });
        setIdPagination?.(pageKey || '', { currentPage: newPage });
    };

    const handleGoSubmit = goToForm.onSubmit((values) => {
        handlers.close();
        if (
            !values.pageNumber ||
            values.pageNumber < 1 ||
            values.pageNumber > pagination.totalPages
        ) {
            return;
        }

        const newPage = values.pageNumber - 1;
        tableRef.current?.api.paginationGoToPage(newPage);
        setPagination?.({ data: { currentPage: newPage }, key: pageKey });
        setIdPagination?.(pageKey || '', { currentPage: newPage });
    });

    const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage + 1;
    const currentPageMaxIndex = (pagination.currentPage + 1) * pagination.itemsPerPage;
    const currentPageStopIndex =
        currentPageMaxIndex > pagination.totalItems ? pagination.totalItems : currentPageMaxIndex;

    return (
        <MotionFlex
            align="center"
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            initial={{ y: 50 }}
            justify="space-between"
            layout
            p="1rem"
            ref={containerQuery.ref}
            sx={{ borderTop: '1px solid var(--generic-border-color)' }}
        >
            <Text
                $secondary
                size="md"
            >
                {containerQuery.isMd ? (
                    <>
                        Showing <b>{currentPageStartIndex}</b> - <b>{currentPageStopIndex}</b> of{' '}
                        <b>{pagination.totalItems}</b> items
                    </>
                ) : containerQuery.isSm ? (
                    <>
                        <b>{currentPageStartIndex}</b> - <b>{currentPageStopIndex}</b> of{' '}
                        <b>{pagination.totalItems}</b> items
                    </>
                ) : (
                    <>
                        <b>{currentPageStartIndex}</b> - <b>{currentPageStopIndex}</b> of{' '}
                        <b>{pagination.totalItems}</b>
                    </>
                )}
            </Text>
            <Group
                noWrap
                ref={containerQuery.ref}
                spacing="sm"
            >
                <Popover
                    onClose={() => handlers.close()}
                    opened={isGoToPageOpen}
                    position="bottom-start"
                    trapFocus
                >
                    <Popover.Target>
                        <Button
                            onClick={() => handlers.toggle()}
                            radius="sm"
                            size="sm"
                            sx={{ height: '26px', padding: '0', width: '26px' }}
                            tooltip={{
                                label: t('action.goToPage', { postProcess: 'sentenceCase' }),
                            }}
                            variant="default"
                        >
                            <RiHashtag size={15} />
                        </Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        <form onSubmit={handleGoSubmit}>
                            <Group>
                                <NumberInput
                                    {...goToForm.getInputProps('pageNumber')}
                                    hideControls={false}
                                    max={pagination.totalPages}
                                    min={1}
                                    width={70}
                                />
                                <Button
                                    type="submit"
                                    variant="filled"
                                >
                                    Go
                                </Button>
                            </Group>
                        </form>
                    </Popover.Dropdown>
                </Popover>
                <Pagination
                    $hideDividers={!containerQuery.isSm}
                    boundaries={1}
                    noWrap
                    onChange={handlePagination}
                    radius="sm"
                    siblings={containerQuery.isMd ? 2 : containerQuery.isSm ? 1 : 0}
                    total={pagination.totalPages - 1}
                    value={pagination.currentPage + 1}
                />
            </Group>
        </MotionFlex>
    );
};
