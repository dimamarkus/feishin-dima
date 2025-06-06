import { Center, Stack } from '@mantine/core';
import { RiAlbumFill, RiPlayListFill, RiUserVoiceFill } from 'react-icons/ri';
import { generatePath, useNavigate } from 'react-router-dom';
import { SimpleImg } from 'react-simple-img';
import { ListChildComponentProps } from 'react-window';
import styled from 'styled-components';

import { CardRows } from '/@/renderer/components/card';
import { Skeleton } from '/@/renderer/components/skeleton';
import { GridCardControls } from '/@/renderer/components/virtual-grid/grid-card/grid-card-controls';
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
        playButtonBehavior: Play;
        resetInfiniteLoaderCache: () => void;
        route: CardRoute;
    };
    data: any;
    isHidden?: boolean;
    listChildProps: Omit<ListChildComponentProps, 'data' | 'style'>;
}

const DefaultCardContainer = styled.div<{ $isHidden?: boolean; $itemGap: number }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: calc(100% - 2rem);
    margin: ${({ $itemGap }) => $itemGap}px;
    overflow: hidden;
    pointer-events: auto;
    cursor: pointer;
    background: var(--card-default-bg);
    border-radius: var(--card-default-radius);
    opacity: ${({ $isHidden }) => ($isHidden ? 0 : 1)};

    &:hover {
        background: var(--card-default-bg-hover);
    }
`;

const InnerCardContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1rem;
    overflow: hidden;

    .card-controls {
        opacity: 0;
    }

    &:hover .card-controls {
        opacity: 1;
    }

    &:hover * {
        &::before {
            opacity: 0.5;
        }
    }
`;

const ImageContainer = styled.div<{ $isFavorite?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    aspect-ratio: 1/1;
    overflow: hidden;
    background: var(--placeholder-bg);
    border-radius: var(--card-default-radius);

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

export const DefaultCard = ({
    columnIndex,
    controls,
    data,
    isHidden,
    listChildProps,
}: BaseGridCardProps) => {
    const navigate = useNavigate();

    if (data) {
        const path = generatePath(
            controls.route.route as string,
            controls.route.slugs?.reduce((acc, slug) => {
                return {
                    ...acc,
                    [slug.slugProperty]: data[slug.idProperty],
                };
            }, {}),
        );

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
            <DefaultCardContainer
                $itemGap={controls.itemGap}
                key={`card-${columnIndex}-${listChildProps.index}`}
                onClick={() => navigate(path)}
            >
                <InnerCardContainer>
                    <ImageContainer $isFavorite={data?.userFavorite}>
                        {data?.imageUrl ? (
                            <Image
                                importance="auto"
                                placeholder={data?.imagePlaceholderUrl || 'var(--placeholder-bg)'}
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
                    <DetailContainer>
                        <CardRows
                            data={data}
                            rows={controls.cardRows}
                        />
                    </DetailContainer>
                </InnerCardContainer>
            </DefaultCardContainer>
        );
    }

    return (
        <DefaultCardContainer
            $isHidden={isHidden}
            $itemGap={controls.itemGap}
            key={`card-${columnIndex}-${listChildProps.index}`}
        >
            <InnerCardContainer>
                <ImageContainer>
                    <Skeleton
                        radius="sm"
                        visible
                    />
                </ImageContainer>
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
            </InnerCardContainer>
        </DefaultCardContainer>
    );
};
