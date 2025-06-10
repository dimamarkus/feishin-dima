import { Flex, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { TIME_HOURS, TIME_PERIODS } from '../time-playlists';
import { TimeClock } from './time-clock';

import { Text, TextTitle } from '/@/renderer/components';
import { PageHeader } from '/@/renderer/components/page-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

// Removed unused HeaderContainer and TimeIcon styled components

const HelpText = styled.div`
    background-color: var(--primary-bg);
    border-radius: 8px;
    padding: 16px;
    margin: 16px;
    font-size: 14px;
    line-height: 1.5;

    h3 {
        margin-top: 0;
        margin-bottom: 12px;
    }

    p {
        margin: 0 0 12px 0;
    }

    code {
        background-color: var(--primary-bg-hover);
        padding: 2px 4px;
        border-radius: 4px;
    }
`;

const GridContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
`;

const Section = styled.div`
    margin-bottom: 32px;

    &:last-child {
        margin-bottom: 0;
    }
`;

// Removed unused SectionTitle styled component - now using TextTitle

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
`;

const TimeCard = styled.div`
    background: var(--generic-bg);
    border: 1px solid var(--generic-border);
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--generic-bg-hover);
        border-color: var(--accent);
        transform: translateY(-2px);
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
`;

const CardIcon = styled.div`
    font-size: 20px;
`;

const CardTitle = styled(Text)`
    font-weight: 500;
`;

const ClockSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 32px;
    padding: 24px;
    background: var(--generic-bg);
    border-radius: 12px;
    border: 1px solid var(--generic-border);
`;

interface TimeCardDisplayProps {
    onCardClick: (timeId: string) => void;
    timePlaylist: any; // Using 'any' for now as TimePlaylist type is in time-playlists.ts
}

// Simplified TimeCard without individual song count fetching
const TimeCardDisplay = ({ onCardClick, timePlaylist }: TimeCardDisplayProps) => {
    const timeId = timePlaylist.id.replace('time-', '');

    return (
        <TimeCard
            key={timePlaylist.id}
            onClick={() => onCardClick(timeId)}
        >
            <CardHeader>
                <CardIcon>{timePlaylist.icon}</CardIcon>
                <div>
                    <CardTitle>{timePlaylist.displayName}</CardTitle>
                    {/* Removed <CardCount>{songCount} songs</CardCount> */}
                </div>
            </CardHeader>
        </TimeCard>
    );
};

export const TimeOverviewRoute = () => {
    const navigate = useNavigate();

    const handleCardClick = (timeId: string) => {
        navigate(`/library/time/${timeId}`);
    };

    // 24 hours in a day
    const totalHours = 24;

    return (
        <AnimatedPage>
            <Stack spacing={0}>
                <PageHeader backgroundColor="var(--titlebar-bg)">
                    <Flex
                        justify="space-between"
                        w="100%"
                    >
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.Title>Time of Day</LibraryHeaderBar.Title>
                            <LibraryHeaderBar.Badge>{totalHours}</LibraryHeaderBar.Badge>
                        </LibraryHeaderBar>
                        <Group />
                    </Flex>
                </PageHeader>
                <FilterBar />
                <ContentContainer>
                    <HelpText>
                        <h3>About the Time Feature</h3>
                        <p>
                            This feature lets you browse songs based on time of day information
                            stored in your music metadata. To use it effectively, your music files
                            should have time tags in their metadata.
                        </p>
                        <p>
                            The Time feature searches for time-related terms (like <code>3am</code>,{' '}
                            <code>7pm</code>, etc.) in your song metadata. If you&apos;re not seeing
                            any results, you may need to:
                        </p>
                        <ul>
                            <li>
                                Add time tags to your music metadata (in fields like lyricist,
                                comment, or tags)
                            </li>
                            <li>
                                Use common time formats like <code>3am</code>, <code>15:00</code>,{' '}
                                <code>3:00 PM</code>
                            </li>
                            <li>Ensure your music server has indexed these fields</li>
                        </ul>
                    </HelpText>

                    <GridContainer>
                        <ClockSection>
                            <TextTitle
                                order={2}
                                weight={700}
                            >
                                Interactive Clock
                            </TextTitle>
                            <Text
                                style={{
                                    marginBottom: '20px',
                                    opacity: 0.8,
                                    textAlign: 'center',
                                }}
                            >
                                Click on any hour to explore music for that time
                            </Text>
                            <TimeClock size={360} />
                        </ClockSection>

                        <Section>
                            <TextTitle
                                order={2}
                                weight={700}
                            >
                                Time Periods
                            </TextTitle>
                            <Grid>
                                {TIME_PERIODS.map((timePlaylist) => (
                                    <TimeCardDisplay
                                        key={timePlaylist.id}
                                        onCardClick={handleCardClick}
                                        timePlaylist={timePlaylist}
                                    />
                                ))}
                            </Grid>
                        </Section>

                        <Section>
                            <TextTitle
                                order={2}
                                weight={700}
                            >
                                Individual Hours
                            </TextTitle>
                            <Grid>
                                {TIME_HOURS.map((timePlaylist) => (
                                    <TimeCardDisplay
                                        key={timePlaylist.id}
                                        onCardClick={handleCardClick}
                                        timePlaylist={timePlaylist}
                                    />
                                ))}
                            </Grid>
                        </Section>
                    </GridContainer>
                </ContentContainer>
            </Stack>
        </AnimatedPage>
    );
};
