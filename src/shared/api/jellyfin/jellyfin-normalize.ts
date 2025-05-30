import { nanoid } from 'nanoid';
import { z } from 'zod';

import { JFAlbum, JFGenre, JFMusicFolder, JFPlaylist } from '/@/shared/api/jellyfin.types';
import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import {
    Album,
    AlbumArtist,
    Genre,
    LibraryItem,
    MusicFolder,
    Playlist,
    RelatedArtist,
    Song,
} from '/@/shared/types/domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/types';

const getStreamUrl = (args: {
    container?: string;
    deviceId: string;
    eTag?: string;
    id: string;
    mediaSourceId?: string;
    server: null | ServerListItem;
}) => {
    const { deviceId, id, server } = args;

    return (
        `${server?.url}/audio` +
        `/${id}/universal` +
        `?userId=${server?.userId}` +
        `&deviceId=${deviceId}` +
        '&audioCodec=aac' +
        `&apiKey=${server?.credential}` +
        `&playSessionId=${deviceId}` +
        '&container=opus,mp3,aac,m4a,m4b,flac,wav,ogg' +
        '&transcodingContainer=ts' +
        '&transcodingProtocol=http'
    );
};

const getAlbumArtistCoverArtUrl = (args: {
    baseUrl: string;
    item: z.infer<typeof jfType._response.albumArtist>;
    size: number;
}) => {
    const size = args.size ? args.size : 300;

    if (!args.item.ImageTags?.Primary) {
        return null;
    }

    return (
        `${args.baseUrl}/Items` +
        `/${args.item.Id}` +
        '/Images/Primary' +
        `?width=${size}` +
        '&quality=96'
    );
};

const getAlbumCoverArtUrl = (args: { baseUrl: string; item: JFAlbum; size: number }) => {
    const size = args.size ? args.size : 300;

    if (!args.item.ImageTags?.Primary && !args.item?.AlbumPrimaryImageTag) {
        return null;
    }

    return (
        `${args.baseUrl}/Items` +
        `/${args.item.Id}` +
        '/Images/Primary' +
        `?width=${size}` +
        '&quality=96'
    );
};

const getSongCoverArtUrl = (args: {
    baseUrl: string;
    item: z.infer<typeof jfType._response.song>;
    size: number;
}) => {
    const size = args.size ? args.size : 100;

    if (args.item.ImageTags.Primary) {
        return (
            `${args.baseUrl}/Items` +
            `/${args.item.Id}` +
            '/Images/Primary' +
            `?width=${size}` +
            '&quality=96'
        );
    }

    if (args.item?.AlbumPrimaryImageTag) {
        // Fall back to album art if no image embedded
        return (
            `${args.baseUrl}/Items` +
            `/${args.item?.AlbumId}` +
            '/Images/Primary' +
            `?width=${size}` +
            '&quality=96'
        );
    }

    return null;
};

const getPlaylistCoverArtUrl = (args: { baseUrl: string; item: JFPlaylist; size: number }) => {
    const size = args.size ? args.size : 300;

    if (!args.item.ImageTags?.Primary) {
        return null;
    }

    return (
        `${args.baseUrl}/Items` +
        `/${args.item.Id}` +
        '/Images/Primary' +
        `?width=${size}` +
        '&quality=96'
    );
};

type AlbumOrSong = z.infer<typeof jfType._response.album> | z.infer<typeof jfType._response.song>;

const getPeople = (item: AlbumOrSong): null | Record<string, RelatedArtist[]> => {
    if (item.People) {
        const participants: Record<string, RelatedArtist[]> = {};

        for (const person of item.People) {
            const key = person.Type || '';
            const item: RelatedArtist = {
                // for other roles, we just want to display this and not filter.
                // filtering (and links) would require a separate field, PersonIds
                id: '',
                imageUrl: null,
                name: person.Name,
            };

            if (key in participants) {
                participants[key].push(item);
            } else {
                participants[key] = [item];
            }
        }

        return participants;
    }

    return null;
};

const getTags = (item: AlbumOrSong): null | Record<string, string[]> => {
    if (item.Tags) {
        const tags: Record<string, string[]> = {};
        for (const tag of item.Tags) {
            tags[tag] = [];
        }

        return tags;
    }

    return null;
};

const normalizeSong = (
    item: z.infer<typeof jfType._response.song>,
    server: null | ServerListItem,
    deviceId: string,
    imageSize?: number,
): Song => {
    return {
        album: item.Album,
        albumArtists: item.AlbumArtists?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        albumId: item.AlbumId || `dummy/${item.Id}`,
        artistName: item?.ArtistItems?.[0]?.Name,
        artists: item?.ArtistItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        bitRate:
            item.MediaSources?.[0].Bitrate &&
            Number(Math.trunc(item.MediaSources[0].Bitrate / 1000)),
        bpm: null,
        channels: null,
        comment: null,
        compilation: null,
        container: (item.MediaSources && item.MediaSources[0]?.Container) || null,
        createdAt: item.DateCreated,
        discNumber: (item.ParentIndexNumber && item.ParentIndexNumber) || 1,
        discSubtitle: null,
        duration: item.RunTimeTicks / 10000,
        gain:
            item.NormalizationGain !== undefined
                ? {
                      track: item.NormalizationGain,
                  }
                : item.LUFS
                  ? {
                        track: -18 - item.LUFS,
                    }
                  : null,
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl: getSongCoverArtUrl({ baseUrl: server?.url || '', item, size: imageSize || 100 }),
        itemType: LibraryItem.SONG,
        lastPlayedAt: null,
        lyrics: null,
        name: item.Name,
        participants: getPeople(item),
        path: (item.MediaSources && item.MediaSources[0]?.Path) || null,
        peak: null,
        playCount: (item.UserData && item.UserData.PlayCount) || 0,
        playlistItemId: item.PlaylistItemId,
        releaseDate: item.PremiereDate
            ? new Date(item.PremiereDate).toISOString()
            : item.ProductionYear
              ? new Date(item.ProductionYear, 0, 1).toISOString()
              : null,
        releaseYear: item.ProductionYear ? String(item.ProductionYear) : null,
        serverId: server?.id || '',
        serverType: ServerType.JELLYFIN,
        size: item.MediaSources && item.MediaSources[0]?.Size,
        streamUrl: getStreamUrl({
            container: item.MediaSources?.[0]?.Container,
            deviceId,
            eTag: item.MediaSources?.[0]?.ETag,
            id: item.Id,
            mediaSourceId: item.MediaSources?.[0]?.Id,
            server,
        }),
        tags: getTags(item),
        trackNumber: item.IndexNumber,
        uniqueId: nanoid(),
        updatedAt: item.DateCreated,
        userFavorite: (item.UserData && item.UserData.IsFavorite) || false,
        userRating: null,
    };
};

const normalizeAlbum = (
    item: z.infer<typeof jfType._response.album>,
    server: null | ServerListItem,
    imageSize?: number,
): Album => {
    return {
        albumArtist: item.AlbumArtist,
        albumArtists:
            item.AlbumArtists.map((entry) => ({
                id: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) || [],
        artists: item.ArtistItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        backdropImageUrl: null,
        comment: null,
        createdAt: item.DateCreated,
        duration: item.RunTimeTicks / 10000,
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
        id: item.Id,
        imagePlaceholderUrl: null,
        imageUrl: getAlbumCoverArtUrl({
            baseUrl: server?.url || '',
            item,
            size: imageSize || 300,
        }),
        isCompilation: null,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: null,
        mbzId: item.ProviderIds?.MusicBrainzAlbum || null,
        name: item.Name,
        originalDate: null,
        participants: getPeople(item),
        playCount: item.UserData?.PlayCount || 0,
        releaseDate: item.PremiereDate?.split('T')[0] || null,
        releaseYear: item.ProductionYear || null,
        serverId: server?.id || '',
        serverType: ServerType.JELLYFIN,
        size: null,
        songCount: item?.ChildCount || null,
        songs: item.Songs?.map((song) => normalizeSong(song, server, '', imageSize)),
        tags: getTags(item),
        uniqueId: nanoid(),
        updatedAt: item?.DateLastMediaAdded || item.DateCreated,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: null,
    };
};

const normalizeAlbumArtist = (
    item: z.infer<typeof jfType._response.albumArtist> & {
        similarArtists?: z.infer<typeof jfType._response.albumArtistList>;
    },
    server: null | ServerListItem,
    imageSize?: number,
): AlbumArtist => {
    const similarArtists =
        item.similarArtists?.Items?.filter((entry) => entry.Name !== 'Various Artists').map(
            (entry) => ({
                id: entry.Id,
                imageUrl: getAlbumArtistCoverArtUrl({
                    baseUrl: server?.url || '',
                    item: entry,
                    size: imageSize || 300,
                }),
                name: entry.Name,
            }),
        ) || [];

    return {
        albumCount: item.AlbumCount ?? null,
        backgroundImageUrl: null,
        biography: item.Overview || null,
        duration: item.RunTimeTicks / 10000,
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
        id: item.Id,
        imageUrl: getAlbumArtistCoverArtUrl({
            baseUrl: server?.url || '',
            item,
            size: imageSize || 300,
        }),
        itemType: LibraryItem.ALBUM_ARTIST,
        lastPlayedAt: null,
        mbz: item.ProviderIds?.MusicBrainzArtist || null,
        name: item.Name,
        playCount: item.UserData?.PlayCount || 0,
        serverId: server?.id || '',
        serverType: ServerType.JELLYFIN,
        similarArtists,
        songCount: item.SongCount ?? null,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: null,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof jfType._response.playlist>,
    server: null | ServerListItem,
    imageSize?: number,
): Playlist => {
    const imageUrl = getPlaylistCoverArtUrl({
        baseUrl: server?.url || '',
        item,
        size: imageSize || 300,
    });

    const imagePlaceholderUrl = null;

    return {
        description: item.Overview || null,
        duration: item.RunTimeTicks / 10000,
        genres: item.GenreItems?.map((entry) => ({
            id: entry.Id,
            imageUrl: null,
            itemType: LibraryItem.GENRE,
            name: entry.Name,
        })),
        id: item.Id,
        imagePlaceholderUrl,
        imageUrl: imageUrl || null,
        itemType: LibraryItem.PLAYLIST,
        name: item.Name,
        owner: null,
        ownerId: null,
        public: null,
        rules: null,
        serverId: server?.id || '',
        serverType: ServerType.JELLYFIN,
        size: null,
        songCount: item?.ChildCount || null,
        sync: null,
    };
};

const normalizeMusicFolder = (item: JFMusicFolder): MusicFolder => {
    return {
        id: item.Id,
        name: item.Name,
    };
};

// const normalizeArtist = (item: any) => {
//   return {
//     album: (item.album || []).map((entry: any) => normalizeAlbum(entry)),
//     albumCount: item.AlbumCount,
//     duration: item.RunTimeTicks / 10000000,
//     genre: item.GenreItems && item.GenreItems.map((entry: any) => normalizeItem(entry)),
//     id: item.Id,
//     image: getCoverArtUrl(item),
//     info: {
//       biography: item.Overview,
//       externalUrl: (item.ExternalUrls || []).map((entry: any) => normalizeItem(entry)),
//       imageUrl: undefined,
//       similarArtist: (item.similarArtist || []).map((entry: any) => normalizeArtist(entry)),
//     },
//     starred: item.UserData && item.UserData?.IsFavorite ? 'true' : undefined,
//     title: item.Name,
//     uniqueId: nanoid(),
//   };
// };

const getGenreCoverArtUrl = (args: {
    baseUrl: string;
    item: z.infer<typeof jfType._response.genre>;
    size: number;
}) => {
    const size = args.size ? args.size : 300;

    if (!args.item.ImageTags?.Primary) {
        return null;
    }

    return (
        `${args.baseUrl}/Items` +
        `/${args.item.Id}` +
        '/Images/Primary' +
        `?width=${size}` +
        '&quality=96'
    );
};

const normalizeGenre = (item: JFGenre, server: null | ServerListItem): Genre => {
    return {
        albumCount: undefined,
        id: item.Id,
        imageUrl: getGenreCoverArtUrl({ baseUrl: server?.url || '', item, size: 200 }),
        itemType: LibraryItem.GENRE,
        name: item.Name,
        songCount: undefined,
    };
};

// const normalizeFolder = (item: any) => {
//   return {
//     created: item.DateCreated,
//     id: item.Id,
//     image: getCoverArtUrl(item, 150),
//     isDir: true,
//     title: item.Name,
//     type: Item.Folder,
//     uniqueId: nanoid(),
//   };
// };

// const normalizeScanStatus = () => {
//   return {
//     count: 'N/a',
//     scanning: false,
//   };
// };

export const jfNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    genre: normalizeGenre,
    musicFolder: normalizeMusicFolder,
    playlist: normalizePlaylist,
    song: normalizeSong,
};
