import { Center, Stack } from '@mantine/core';
import { RiAlbumFill, RiPlayListFill, RiUserVoiceFill } from 'react-icons/ri';
import { generatePath, useNavigate } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
import { ListChildComponentProps } from 'react-window';
import styled from 'styled-components';

import { CardRows } from '/@/renderer/components/card';
import { Skeleton } from '/@/renderer/components/skeleton';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
import { LabelAlbumMosaic } from '/@/renderer/features/labels/components/label-album-mosaic';
import { YearAlbumMosaic } from '/@/renderer/features/years/components/year-album-mosaic';
import {
    Album,
    AlbumArtist,
    Artist,
    LibraryItem,
    Playlist,
    Song,
} from '/@/shared/types/domain-types';
import { CardRoute, CardRow, Play, PlayQueueAddOptions } from '/@/shared/types/types';

interface BaseGridCardProps {
    columnIndex: number;
    controls: {
        cardRows: CardRow<Album | AlbumArtist | Artist | Playlist | Song>[];
        handleFavorite: (options: {
            id: string[];
            isFavorite: boolean;
            itemType: LibraryItem;
        }) => void;
        handlePlayQueueAdd: (options: PlayQueueAddOptions) => void;
        itemGap: number;
        itemType: LibraryItem;
        itemWidth?: number;
        playButtonBehavior: Play;
        resetInfiniteLoaderCache: () => void;
        route: CardRoute;
    };
    data: any;
    isHidden?: boolean;
    listChildProps: Omit<ListChildComponentProps, 'data' | 'style'>;
}

const PosterCardContainer = styled.div<{ $isHidden?: boolean; $itemGap: number }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: ${({ $itemGap }) => $itemGap}px;
    overflow: hidden;
    pointer-events: auto;
    opacity: ${({ $isHidden }) => ($isHidden ? 0 : 1)};

    .card-controls {
        opacity: 0;
    }
`;

const LinkContainer = styled.div`
    cursor: pointer;
`;

const ImageContainer = styled.div<{ $isFavorite?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    aspect-ratio: 1/1;
    overflow: hidden;
    background: var(--card-default-bg);
    border-radius: var(--card-poster-radius);

    &::before {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        content: '';
        user-select: none;
        background: linear-gradient(0deg, rgb(0 0 0 / 100%) 35%, rgb(0 0 0 / 0%) 100%);
        opacity: 0;
        transition: all 0.2s ease-in-out;
    }

    ${(props) =>
        props.$isFavorite &&
        `
    &::after {
    position: absolute;
    top: -50px;
    left: -50px;
    width: 80px;
    height: 80px;
    background-color: var(--primary-color);
    box-shadow: 0 0 10px 8px rgba(0, 0, 0, 80%);
    transform: rotate(-45deg);
    content: '';
    pointer-events: none;
  }
  `}

    &:hover {
        &::before {
            opacity: 0.5;
        }
    }

    &:hover .card-controls {
        opacity: 1;
    }
`;

const Image = styled(SimpleImg)`
    width: 100%;
    max-width: 100%;
    height: 100% !important;
    max-height: 100%;
    border: 0;

    img {
        height: 100%;
        object-fit: var(--image-fit);
    }
`;

const DetailContainer = styled.div`
    margin-top: 0.5rem;
`;

export const PosterCard = ({
    columnIndex,
    controls,
    data,
    isHidden,
    listChildProps,
}: BaseGridCardProps) => {
    const navigate = useNavigate();

    if (data) {
        // Handle special routing for years (decades vs individual years)
        let path: string;
        if (controls.itemType === LibraryItem.GENRE && data?.type) {
            // This is a year item with special routing logic
            if (data.type === 'decade') {
                path = generatePath('/library/years/decade/:decadeId', {
                    decadeId: data.displayName,
                });
            } else {
                path = generatePath('/library/years/:yearId', { yearId: data.displayName });
            }
        } else {
            // Normal routing logic
            path = generatePath(
                controls.route.route as string,
                controls.route.slugs?.reduce((acc, slug) => {
                    return {
                        ...acc,
                        [slug.slugProperty]: data[slug.idProperty],
                    };
                }, {}),
            );
        }

        let Placeholder = RiAlbumFill;

        switch (controls.itemType) {
            case LibraryItem.ALBUM:
                Placeholder = RiAlbumFill;
                break;
            case LibraryItem.ALBUM_ARTIST:
                Placeholder = RiUserVoiceFill;
                break;
            case LibraryItem.ARTIST:
                Placeholder = RiUserVoiceFill;
                break;
            case LibraryItem.PLAYLIST:
                Placeholder = RiPlayListFill;
                break;
            default:
                Placeholder = RiAlbumFill;
                break;
        }

        return (
            <PosterCardContainer
                $itemGap={controls.itemGap}
                key={`card-${columnIndex}-${listChildProps.index}`}
            >
                <LinkContainer onClick={() => navigate(path)}>
                    <ImageContainer $isFavorite={data?.userFavorite}>
                        {controls.itemType === LibraryItem.LABEL &&
                        data?.imageUrl === 'mosaic://label-albums' ? (
                            <LabelAlbumMosaic
                                albums={data.albums || []}
                                size={controls.itemWidth || 200}
                            />
                        ) : controls.itemType === LibraryItem.GENRE &&
                          data?.imageUrl === 'mosaic://year-albums' ? (
                            <YearAlbumMosaic
                                size={controls.itemWidth || 200}
                                yearPlaylist={data}
                            />
                        ) : data?.imageUrl ? (
                            <Image
                                importance="auto"
                                placeholder={data?.imagePlaceholderUrl || 'var(--card-default-bg)'}
                                src={data?.imageUrl}
                            />
                        ) : (
                            <Center
                                sx={{
                                    background: 'var(--placeholder-bg)',
                                    borderRadius: 'var(--card-default-radius)',
                                    height: '100%',
                                    width: '100%',
                                }}
                            >
                                <Placeholder
                                    color="var(--placeholder-fg)"
                                    size={35}
                                />
                            </Center>
                        )}
                        <GridCardControls
                            handleFavorite={controls.handleFavorite}
                            handlePlayQueueAdd={controls.handlePlayQueueAdd}
                            itemData={data}
                            itemType={controls.itemType}
                            resetInfiniteLoaderCache={controls.resetInfiniteLoaderCache}
                        />
                    </ImageContainer>
                </LinkContainer>
                <DetailContainer>
                    <CardRows
                        data={data}
                        rows={controls.cardRows}
                    />
                </DetailContainer>
            </PosterCardContainer>
        );
    }

    return (
        <PosterCardContainer
            $isHidden={isHidden}
            $itemGap={controls.itemGap}
            key={`card-${columnIndex}-${listChildProps.index}`}
        >
            <Skeleton
                radius="sm"
                visible
            >
                <ImageContainer />
            </Skeleton>
            <DetailContainer>
                <Stack spacing="sm">
                    {(controls?.cardRows || []).map((row, index) => (
                        <Skeleton
                            height={14}
                            key={`${index}-${columnIndex}-${row.arrayProperty}`}
                            radius="sm"
                            visible
                        />
                    ))}
                </Stack>
            </DetailContainer>
        </PosterCardContainer>
    );
};
