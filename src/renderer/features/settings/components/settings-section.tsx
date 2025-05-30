import { Divider } from '@mantine/core';
import { ReactNode } from 'react';

import { SettingsOptions } from '/@/renderer/features/settings/components/settings-option';
import { useSettingSearchContext } from '/@/renderer/features/settings/context/search-context';

export type SettingOption = {
    control: ReactNode;
    description: ReactNode | string;
    isHidden?: boolean;
    note?: string;
    title: string;
};

interface SettingsSectionProps {
    divider?: boolean;
    options: SettingOption[];
}

export const SettingsSection = ({ divider, options }: SettingsSectionProps) => {
    const keyword = useSettingSearchContext();
    const hasKeyword = keyword !== '';

    const values = options.filter(
        (o) => !o.isHidden && (!hasKeyword || o.title.toLocaleLowerCase().includes(keyword)),
    );

    return (
        <>
            {values.map((option) => (
                <SettingsOptions
                    key={`option-${option.title}`}
                    {...option}
                />
            ))}
            {divider !== false && values.length > 0 && <Divider />}
        </>
    );
};
