import styled from 'styled-components';

import { AlbumCard } from '/@/renderer/components/card/album-card';
import { ALBUM_CARD_ROWS } from '/@/renderer/components/card/card-rows';
import { Text } from '/@/renderer/components/text';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Album, AlbumArtist, Artist, LibraryItem } from '/@/shared/types/domain-types';
import { CardRow } from '/@/shared/types/types';

const AlbumListContainer = styled.div`
    padding: 20px;
`;

const AlbumGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
`;

interface LabelDetailAlbumListProps {
    albums: Album[];
}

export const LabelDetailAlbumList = ({ albums }: LabelDetailAlbumListProps) => {
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    if (albums.length === 0) {
        return (
            <AlbumListContainer>
                <Text
                    opacity={0.7}
                    size="lg"
                    style={{ padding: '40px', textAlign: 'center' }}
                >
                    No albums found for this label
                </Text>
            </AlbumListContainer>
        );
    }

    const cardRows = [
        ALBUM_CARD_ROWS.name,
        ALBUM_CARD_ROWS.albumArtists,
        ALBUM_CARD_ROWS.releaseYear,
    ] as Array<CardRow<Album | AlbumArtist | Artist>>;

    return (
        <AlbumListContainer>
            <AlbumGrid>
                {albums.map((album) => (
                    <AlbumCard
                        controls={{
                            cardRows,
                            itemType: LibraryItem.ALBUM,
                            playButtonBehavior,
                            route: {
                                route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                                slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                            },
                        }}
                        data={album}
                        handlePlayQueueAdd={handlePlayQueueAdd}
                        key={album.id}
                        size={200}
                    />
                ))}
            </AlbumGrid>
        </AlbumListContainer>
    );
};
