import { Group } from '@mantine/core';
import { useCallback } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

import { YEAR_INDIVIDUALS } from '../years-playlists';

import { Button } from '/@/renderer/components';

interface YearNavigationProps {
    currentYear: string;
}

export const YearNavigation = ({ currentYear }: YearNavigationProps) => {
    const navigate = useNavigate();

    // Find current year in the list
    const currentYearNum = parseInt(currentYear);
    const allYears = YEAR_INDIVIDUALS.map((y) => parseInt(y.displayName)).sort((a, b) => a - b);
    const currentIndex = allYears.indexOf(currentYearNum);

    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < allYears.length - 1;

    const handlePrevious = useCallback(() => {
        if (hasPrevious) {
            const previousYear = allYears[currentIndex - 1];
            navigate(`/library/years/${previousYear}`);
        }
    }, [currentIndex, allYears, navigate, hasPrevious]);

    const handleNext = useCallback(() => {
        if (hasNext) {
            const nextYear = allYears[currentIndex + 1];
            navigate(`/library/years/${nextYear}`);
        }
    }, [currentIndex, allYears, navigate, hasNext]);

    return (
        <Group spacing="xs">
            {hasPrevious && (
                <Button
                    compact
                    onClick={handlePrevious}
                    size="sm"
                    tooltip={{ label: `Go to ${allYears[currentIndex - 1]}` }}
                    variant="default"
                >
                    <RiArrowLeftSLine size="1.2rem" />
                </Button>
            )}
            {hasNext && (
                <Button
                    compact
                    onClick={handleNext}
                    size="sm"
                    tooltip={{ label: `Go to ${allYears[currentIndex + 1]}` }}
                    variant="default"
                >
                    <RiArrowRightSLine size="1.2rem" />
                </Button>
            )}
        </Group>
    );
};
