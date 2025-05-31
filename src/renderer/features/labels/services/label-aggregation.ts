import { Album } from '/@/shared/types/domain-types';

export type Label = {
    albumCount: number;
    albums: Album[]; // albums from this label
    id: string; // derived from label name
    name: string;
};

export class LabelAggregationService {
    /**
     * Creates a label ID from the label name (URL-safe)
     */
    static createLabelId(labelName: string): string {
        return labelName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
            .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
    }

    /**
     * Extracts labels from albums and creates virtual label entities
     */
    static extractLabelsFromAlbums(albums: Album[]): Label[] {
        const labelMap = new Map<string, { albums: Album[]; name: string }>();

        // Group albums by label
        albums.forEach((album) => {
            const labelName = this.getAlbumLabel(album);
            if (labelName) {
                const labelId = this.createLabelId(labelName);

                if (labelMap.has(labelId)) {
                    labelMap.get(labelId)!.albums.push(album);
                } else {
                    labelMap.set(labelId, {
                        albums: [album],
                        name: labelName,
                    });
                }
            }
        });

        // Convert to Label entities
        return Array.from(labelMap.entries()).map(([labelId, data]) => ({
            albumCount: data.albums.length,
            albums: data.albums,
            id: labelId,
            name: data.name,
        }));
    }

    /**
     * Filters labels by search term
     */
    static filterLabels(labels: Label[], searchTerm?: string): Label[] {
        if (!searchTerm) return labels;

        const term = searchTerm.toLowerCase();
        return labels.filter((label) => label.name.toLowerCase().includes(term));
    }

    /**
     * Extracts label name from album tags with fallback priority
     * Priority: label > organization > publisher
     */
    static getAlbumLabel(album: Album): null | string {
        if (!album.tags) return null;

        // Check in priority order
        const labelFields = ['label', 'organization', 'publisher'];

        for (const field of labelFields) {
            const fieldValue = album.tags[field];
            if (fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0) {
                // Take the first value if multiple labels exist
                return fieldValue[0].trim();
            }
        }

        return null;
    }

    /**
     * Gets albums for a specific label
     */
    static getAlbumsForLabel(albums: Album[], labelName: string): Album[] {
        return albums.filter((album) => {
            const albumLabel = this.getAlbumLabel(album);
            return albumLabel === labelName;
        });
    }

    /**
     * Gets albums for a specific label by ID
     */
    static getAlbumsForLabelId(albums: Album[], labelId: string): Album[] {
        return albums.filter((album) => {
            const albumLabel = this.getAlbumLabel(album);
            if (!albumLabel) return false;
            return this.createLabelId(albumLabel) === labelId;
        });
    }

    /**
     * Applies pagination to label list
     */
    static paginateLabels(labels: Label[], limit?: number, offset?: number): Label[] {
        if (!limit) return labels;

        const start = offset || 0;
        const end = start + limit;

        return labels.slice(start, end);
    }

    /**
     * Sorts labels by various criteria
     */
    static sortLabels(
        labels: Label[],
        sortBy: 'albumCount' | 'name',
        sortOrder: 'asc' | 'desc',
    ): Label[] {
        const sorted = [...labels].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'albumCount':
                    comparison = a.albumCount - b.albumCount;
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name, undefined, {
                        numeric: true,
                        sensitivity: 'base',
                    });
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return sorted;
    }
}
