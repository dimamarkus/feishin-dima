import { Label, LabelAggregationService } from '../services/label-aggregation';

import { api } from '/@/renderer/api';
import { Album, AlbumListSort, SortOrder } from '/@/shared/types/domain-types';
import { ServerListItem } from '/@/shared/types/types';

export type LabelListArgs = {
    apiClientProps: {
        server: null | ServerListItem;
        signal?: AbortSignal;
    };
    query?: LabelListQuery;
};

export type LabelListQuery = {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: 'albumCount' | 'name';
    sortOrder?: 'asc' | 'desc';
};

export type LabelListResponse = {
    items: Label[];
    startIndex: number;
    totalRecordCount: number;
};

export class VirtualLabelAPI {
    /**
     * Gets albums for a specific label (useful for label detail pages)
     */
    static async getAlbumsForLabel(args: {
        apiClientProps: {
            server: null | ServerListItem;
            signal?: AbortSignal;
        };
        labelId: string;
        query?: {
            limit?: number;
            offset?: number;
            sortBy?: AlbumListSort;
            sortOrder?: SortOrder;
        };
    }) {
        const { apiClientProps, labelId, query = {} } = args;

        // Fetch all albums
        const albums = await this.getAllAlbums(apiClientProps);

        // Filter albums for this label
        const labelAlbums = LabelAggregationService.getAlbumsForLabelId(albums, labelId);

        // TODO: Apply sorting and pagination to albums if needed
        // For now, return all albums for the label

        return {
            items: labelAlbums,
            startIndex: query.offset || 0,
            totalRecordCount: labelAlbums.length,
        };
    }

    /**
     * Gets a specific label by ID with its albums
     */
    static async getLabelDetail(args: {
        apiClientProps: {
            server: null | ServerListItem;
            signal?: AbortSignal;
        };
        labelId: string;
    }): Promise<Label | null> {
        const { apiClientProps, labelId } = args;

        // 1. Fetch all album summaries to identify labels and albums per label
        const allAlbumSummaries = await this.getAllAlbums(apiClientProps);
        const allLabels = LabelAggregationService.extractLabelsFromAlbums(allAlbumSummaries);
        const targetLabelSummary = allLabels.find((l) => l.id === labelId);

        if (!targetLabelSummary || !apiClientProps.server) {
            return null;
        }

        // 2. If target label found, fetch full details for its albums
        // Use Promise.allSettled to avoid failing the whole operation if one album detail fetch fails
        const detailedAlbumsResults = await Promise.allSettled(
            targetLabelSummary.albums.map((albumSummary) =>
                api.controller.getAlbumDetail({
                    apiClientProps,
                    query: { id: albumSummary.id },
                }),
            ),
        );

        const detailedAlbums: Album[] = [];
        detailedAlbumsResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                detailedAlbums.push(result.value);
            } else if (result.status === 'rejected') {
                // Optionally log the error for the failed album detail fetch
                console.error(`Failed to fetch album detail:`, result.reason);
            }
        });

        // If, for some reason, all detail fetches fail, we might fall back to summary or return as is
        // For now, we use successfully fetched detailed albums.

        return {
            ...targetLabelSummary,
            // albumCount should ideally remain consistent with the summary unless an album became inaccessible
            albumCount: detailedAlbums.length,
            albums: detailedAlbums,
        };
    }

    /**
     * Gets list of labels with filtering, sorting, and pagination
     */
    static async getLabelList(args: LabelListArgs): Promise<LabelListResponse> {
        const { apiClientProps, query = {} } = args;

        // Fetch all albums
        const albums = await this.getAllAlbums(apiClientProps);

        // Extract labels from albums
        let labels = LabelAggregationService.extractLabelsFromAlbums(albums);

        // Apply search filter
        if (query.search) {
            labels = LabelAggregationService.filterLabels(labels, query.search);
        }

        // Store total count before pagination
        const totalRecordCount = labels.length;

        // Apply sorting
        const sortBy = query.sortBy || 'name';
        const sortOrder = query.sortOrder || 'asc';
        labels = LabelAggregationService.sortLabels(labels, sortBy, sortOrder);

        // Apply pagination
        const startIndex = query.offset || 0;
        const paginatedLabels = LabelAggregationService.paginateLabels(
            labels,
            query.limit,
            startIndex,
        );

        return {
            items: paginatedLabels,
            startIndex,
            totalRecordCount,
        };
    }

    /**
     * Gets label statistics (useful for dashboard/overview)
     */
    static async getLabelStats(args: {
        apiClientProps: {
            server: null | ServerListItem;
            signal?: AbortSignal;
        };
    }) {
        const { apiClientProps } = args;

        // Fetch all albums
        const albums = await this.getAllAlbums(apiClientProps);

        // Extract labels
        const labels = LabelAggregationService.extractLabelsFromAlbums(albums);

        // Calculate stats
        const totalLabels = labels.length;
        const totalAlbumsWithLabels = albums.filter(
            (album) => LabelAggregationService.getAlbumLabel(album) !== null,
        ).length;
        const totalAlbums = albums.length;

        const mostPopularLabel = labels.reduce(
            (prev, current) => (prev.albumCount > current.albumCount ? prev : current),
            labels[0],
        );

        return {
            coveragePercentage: totalAlbums > 0 ? (totalAlbumsWithLabels / totalAlbums) * 100 : 0,
            mostPopularLabel,
            totalAlbums,
            totalAlbumsWithLabels,
            totalLabels,
        };
    }

    /**
     * Fetches all albums and extracts label data
     */
    private static async getAllAlbums(args: {
        server: null | ServerListItem;
        signal?: AbortSignal;
    }) {
        if (!args.server) throw new Error('Server not found');

        // Fetch a large number of albums to get comprehensive label data
        // In a real implementation, you might want to fetch ALL albums in batches
        const albumResponse = await api.controller.getAlbumList({
            apiClientProps: args,
            query: {
                _custom: {
                    jellyfin: {
                        // Request additional fields that might contain catalog numbers
                        Fields: 'Tags,ProviderIds,UserData,ItemCounts,ChildCount,Path,Overview,RunTimeTicks',
                    },
                    navidrome: {
                        // No specific "includeAllTags" for album list, hoping tags are included by default
                        // or that relevant ones for catalog numbers are standard.
                    },
                },
                limit: 1000, // Fetch a large batch
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
        });

        return albumResponse?.items || [];
    }
}
