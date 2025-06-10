import { Center } from '@mantine/core';
import clsx from 'clsx';
import { memo } from 'react';
import {
    RiAlbumFill,
    RiCalendarFill,
    RiPlayListFill,
    RiPriceTag3Fill,
    RiUserVoiceFill,
} from 'react-icons/ri';

import styles from './item-image-placeholder.module.css';

import { LibraryItem } from '/@/shared/types/domain-types';

interface ItemImagePlaceholderProps {
    itemType?: LibraryItem;
}

const Image = memo(function Image(props: ItemImagePlaceholderProps) {
    switch (props.itemType) {
        case LibraryItem.ALBUM:
            return <RiAlbumFill />;
        case LibraryItem.ALBUM_ARTIST:
            return <RiUserVoiceFill />;
        case LibraryItem.ARTIST:
            return <RiUserVoiceFill />;
        case LibraryItem.LABEL:
            return <RiPriceTag3Fill />;
        case LibraryItem.PLAYLIST:
            return <RiPlayListFill />;
        case LibraryItem.YEAR:
            return <RiCalendarFill />;
        default:
            return <RiAlbumFill />;
    }
});

export const ItemImagePlaceholder = ({ itemType }: ItemImagePlaceholderProps) => {
    return (
        <Center className={clsx(styles.imagePlaceholder, 'item-image-placeholder')}>
            <Image itemType={itemType} />
        </Center>
    );
};
