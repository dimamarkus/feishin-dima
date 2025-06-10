import { Group } from '@mantine/core';
import { useCallback } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

import { TIME_HOURS } from '../time-playlists';

import { Button } from '/@/renderer/components';

interface TimeNavigationProps {
    currentTimeId: string;
}

export const TimeNavigation = ({ currentTimeId }: TimeNavigationProps) => {
    const navigate = useNavigate();

    // Find current time in the list and ensure we have all 24 hours (00-23)
    const currentHour = parseInt(currentTimeId);

    // Calculate previous and next hours with looping
    const previousHour = currentHour === 0 ? 23 : currentHour - 1;
    const nextHour = currentHour === 23 ? 0 : currentHour + 1;

    // Format hours with leading zeros
    const formatHour = (hour: number) => hour.toString().padStart(2, '0');

    // Get display names for tooltips
    const getTimeDisplay = (hour: number) => {
        const timeData = TIME_HOURS.find((t) => t.id === `time-${formatHour(hour)}`);
        return timeData?.displayName || `${formatHour(hour)}:00`;
    };

    const handlePrevious = useCallback(() => {
        navigate(`/library/time/${formatHour(previousHour)}`);
    }, [previousHour, navigate]);

    const handleNext = useCallback(() => {
        navigate(`/library/time/${formatHour(nextHour)}`);
    }, [nextHour, navigate]);

    return (
        <Group spacing="xs">
            <Button
                compact
                onClick={handlePrevious}
                size="sm"
                tooltip={{ label: `Go to ${getTimeDisplay(previousHour)}` }}
                variant="default"
            >
                <RiArrowLeftSLine size="1.2rem" />
            </Button>
            <Button
                compact
                onClick={handleNext}
                size="sm"
                tooltip={{ label: `Go to ${getTimeDisplay(nextHour)}` }}
                variant="default"
            >
                <RiArrowRightSLine size="1.2rem" />
            </Button>
        </Group>
    );
};
