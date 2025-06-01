import { Group, Paper, Text, UnstyledButton } from '@mantine/core';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { TIME_HOURS } from '../time-playlists';

interface TimeClockProps {
    size?: number;
}

export const TimeClock = ({ size = 300 }: TimeClockProps) => {
    const navigate = useNavigate();

    // Generate hour positions around the clock
    const hourPositions = useMemo(() => {
        const positions = [];
        const radius = (size - 60) / 2; // Leave space for hour labels
        const centerX = size / 2;
        const centerY = size / 2;

        for (let hour = 1; hour <= 12; hour++) {
            // Start from 12 o'clock (top) and go clockwise
            const angle = ((hour - 3) * 30 * Math.PI) / 180; // -3 to start at 12 o'clock
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            // Find corresponding playlist using 24-hour format
            // Convert 12-hour to 24-hour format for AM/PM
            const amHour = hour === 12 ? 0 : hour; // 12 AM becomes 00
            const pmHour = hour === 12 ? 12 : hour + 12; // 12 PM stays 12, others add 12

            const amPlaylist = TIME_HOURS.find(
                (p) => p.id === `time-${amHour.toString().padStart(2, '0')}`,
            );
            const pmPlaylist = TIME_HOURS.find(
                (p) => p.id === `time-${pmHour.toString().padStart(2, '0')}`,
            );

            positions.push({
                amPlaylist,
                hour,
                pmPlaylist,
                x,
                y,
            });
        }

        return positions;
    }, [size]);

    const handleHourClick = (period: 'am' | 'pm', hour: number) => {
        // Convert to 24-hour format for the route
        const hour24 = period === 'am' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;

        const playlistId = hour24.toString().padStart(2, '0');
        navigate(`/library/time/${playlistId}`);
    };

    return (
        <Paper
            radius="xl"
            shadow="md"
            style={{
                background:
                    'radial-gradient(circle, var(--mantine-color-gray-0) 0%, var(--mantine-color-gray-1) 100%)',
                border: '8px solid var(--mantine-color-gray-3)',
                height: size,
                position: 'relative',
                width: size,
            }}
        >
            {/* Clock center dot */}
            <div
                style={{
                    background: 'var(--mantine-color-blue-6)',
                    borderRadius: '50%',
                    height: 12,
                    left: '50%',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 12,
                    zIndex: 10,
                }}
            />

            {/* Hour markers and labels */}
            {hourPositions.map(({ amPlaylist, hour, pmPlaylist, x, y }) => (
                <div
                    key={hour}
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        height: 60,
                        justifyContent: 'center',
                        left: x - 30,
                        position: 'absolute',
                        top: y - 30,
                        width: 60,
                    }}
                >
                    {/* Hour number */}
                    <Text
                        size="lg"
                        style={{
                            color: 'var(--mantine-color-gray-8)',
                            textAlign: 'center',
                        }}
                        weight={700}
                    >
                        {hour}
                    </Text>

                    {/* AM/PM buttons */}
                    <Group spacing={4}>
                        {amPlaylist && (
                            <UnstyledButton
                                onClick={() => handleHourClick('am', hour)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        'var(--mantine-color-blue-2)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        'var(--mantine-color-blue-1)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                style={{
                                    background: 'var(--mantine-color-blue-1)',
                                    border: '1px solid var(--mantine-color-blue-3)',
                                    borderRadius: 4,
                                    color: 'var(--mantine-color-blue-7)',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                AM
                            </UnstyledButton>
                        )}
                        {pmPlaylist && (
                            <UnstyledButton
                                onClick={() => handleHourClick('pm', hour)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                        'var(--mantine-color-orange-2)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                        'var(--mantine-color-orange-1)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                style={{
                                    background: 'var(--mantine-color-orange-1)',
                                    border: '1px solid var(--mantine-color-orange-3)',
                                    borderRadius: 4,
                                    color: 'var(--mantine-color-orange-7)',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                PM
                            </UnstyledButton>
                        )}
                    </Group>
                </div>
            ))}

            {/* Clock tick marks */}
            {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const outerRadius = (size - 20) / 2;
                const innerRadius = outerRadius - 10;
                const centerX = size / 2;
                const centerY = size / 2;

                const x1 = centerX + innerRadius * Math.cos(angle);
                const y1 = centerY + innerRadius * Math.sin(angle);
                const x2 = centerX + outerRadius * Math.cos(angle);
                const y2 = centerY + outerRadius * Math.sin(angle);

                return (
                    <div
                        key={i}
                        style={{
                            background: 'var(--mantine-color-gray-4)',
                            height: Math.abs(y2 - y1) || 2,
                            left: x1,
                            position: 'absolute',
                            top: y1,
                            transform: `rotate(${i * 30}deg)`,
                            transformOrigin: '0 0',
                            width: Math.abs(x2 - x1) || 2,
                        }}
                    />
                );
            })}
        </Paper>
    );
};
