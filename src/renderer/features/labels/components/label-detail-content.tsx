import { Stack } from '@mantine/core';
import styled from 'styled-components';

import { Label } from '../services/label-aggregation';
import { LabelDetailAlbumList } from './label-detail-album-list';
import { LabelDetailHeader } from './label-detail-header';

import { Text } from '/@/renderer/components/text';

const Container = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const ContentArea = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const SectionHeader = styled.div`
    padding: 20px 20px 0 20px;
    border-bottom: 1px solid var(--generic-border-color);
    margin-bottom: 0;
`;

interface LabelDetailContentProps {
    background?: string;
    error?: null | string;
    headerRef?: React.RefObject<HTMLDivElement>;
    isLoading?: boolean;
    label?: Label | null;
}

export const LabelDetailContent = ({
    background,
    error,
    headerRef,
    isLoading,
    label,
}: LabelDetailContentProps) => {
    if (isLoading) {
        return (
            <Container>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text size="lg">Loading label...</Text>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text
                        c="red"
                        size="lg"
                    >
                        Error loading label: {error}
                    </Text>
                </div>
            </Container>
        );
    }

    if (!label) {
        return (
            <Container>
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <Text
                        opacity={0.7}
                        size="lg"
                    >
                        Label not found
                    </Text>
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <LabelDetailHeader
                background={background}
                label={label}
                ref={headerRef}
            />
            <ContentArea>
                <Stack spacing={0}>
                    <SectionHeader>
                        <Text
                            size="xl"
                            style={{ paddingBottom: '16px' }}
                            weight={600}
                        >
                            Albums
                        </Text>
                    </SectionHeader>
                    <LabelDetailAlbumList albums={label.albums} />
                </Stack>
            </ContentArea>
        </Container>
    );
};
