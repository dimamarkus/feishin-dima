import { Flex, Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { YEAR_DECADES, YEAR_INDIVIDUALS } from '../years-playlists';

import { Text, TextTitle } from '/@/renderer/components';
import { PageHeader } from '/@/renderer/components/page-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

// Removed unused HeaderContainer and YearIcon styled components

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
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
`;

const YearCard = styled.div`
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

const CardDescription = styled(Text)`
    font-size: 12px;
    opacity: 0.7;
`;

const YearsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px;
`;

const YearButton = styled.div`
    background: var(--generic-bg);
    border: 1px solid var(--generic-border);
    border-radius: 6px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;

    &:hover {
        background: var(--generic-bg-hover);
        border-color: var(--accent);
        transform: scale(1.05);
    }
`;

interface YearCardDisplayProps {
    onCardClick: (yearId: string) => void;
    yearPlaylist: any;
}

const YearCardDisplay = ({ onCardClick, yearPlaylist }: YearCardDisplayProps) => {
    const yearId = yearPlaylist.id.replace('year-', '');

    return (
        <YearCard
            key={yearPlaylist.id}
            onClick={() => onCardClick(yearId)}
        >
            <CardHeader>
                <CardIcon>{yearPlaylist.icon}</CardIcon>
                <div>
                    <CardTitle>{yearPlaylist.displayName}</CardTitle>
                </div>
            </CardHeader>
        </YearCard>
    );
};

export const YearsOverviewRoute = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleCardClick = (yearId: string) => {
        if (yearId.endsWith('s')) {
            // It's a decade
            navigate(`/library/years/decade/${yearId}`);
        } else {
            // It's a specific year
            navigate(`/library/years/${yearId}`);
        }
    };

    const handleYearClick = (year: number) => {
        navigate(`/library/years/${year}`);
    };

    // Calculate total years (decades + individuals)
    const totalYears = YEAR_DECADES.length + YEAR_INDIVIDUALS.length;

    return (
        <AnimatedPage>
            <Stack spacing={0}>
                <PageHeader backgroundColor="var(--titlebar-bg)">
                    <Flex
                        justify="space-between"
                        w="100%"
                    >
                        <LibraryHeaderBar>
                            <LibraryHeaderBar.Title>
                                {t('page.yearsList.title')}
                            </LibraryHeaderBar.Title>
                            <LibraryHeaderBar.Badge>{totalYears}</LibraryHeaderBar.Badge>
                        </LibraryHeaderBar>
                        <Group />
                    </Flex>
                </PageHeader>
                <FilterBar />
                <ContentContainer>
                    <HelpText>
                        <h3>About the Years Feature</h3>
                        <p>
                            Browse your music library organized by release year. Explore albums from
                            specific years or browse entire decades to discover music from different
                            eras.
                        </p>
                        <p>
                            Albums are organized based on their <code>releaseYear</code> metadata.
                            You can:
                        </p>
                        <ul>
                            <li>
                                Browse by <strong>decades</strong> for broad exploration
                            </li>
                            <li>
                                Browse by <strong>specific years</strong> for precise discovery
                            </li>
                            <li>See album grids for each time period</li>
                        </ul>
                    </HelpText>

                    <GridContainer>
                        <Section>
                            <TextTitle
                                order={2}
                                weight={700}
                            >
                                Decades
                            </TextTitle>
                            <Grid>
                                {YEAR_DECADES.map((yearPlaylist) => (
                                    <YearCardDisplay
                                        key={yearPlaylist.id}
                                        onCardClick={handleCardClick}
                                        yearPlaylist={yearPlaylist}
                                    />
                                ))}
                            </Grid>
                        </Section>

                        <Section>
                            <TextTitle
                                order={2}
                                weight={700}
                            >
                                All Years
                            </TextTitle>
                            <YearsGrid>
                                {YEAR_INDIVIDUALS.slice()
                                    .reverse()
                                    .map((yearPlaylist) => {
                                        const year = parseInt(yearPlaylist.displayName);
                                        return (
                                            <YearButton
                                                key={year}
                                                onClick={() => handleYearClick(year)}
                                            >
                                                {year}
                                            </YearButton>
                                        );
                                    })}
                            </YearsGrid>
                        </Section>
                    </GridContainer>
                </ContentContainer>
            </Stack>
        </AnimatedPage>
    );
};
