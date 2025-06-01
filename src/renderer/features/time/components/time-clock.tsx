import { Group, Paper, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TIME_HOURS } from '../time-playlists';

interface HourPosition {
    amPlaylist: any;
    hour: number;
    pmPlaylist: any;
    x: number;
    y: number;
}

interface TimeClockProps {
    size?: number;
}

export const TimeClock = ({ size = 300 }: TimeClockProps) => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Calculate angles for clock hands
    const handAngles = useMemo(() => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const seconds = currentTime.getSeconds();

        // Minute hand: 6 degrees per minute
        const minuteAngle = minutes * 6 + seconds * 0.1;

        // Hour hand: 30 degrees per hour + 0.5 degrees per minute
        const hourAngle = (hours % 12) * 30 + minutes * 0.5;

        return { hourAngle, minuteAngle };
    }, [currentTime]);

    // Generate hour positions around the clock
    const hourPositions = useMemo((): HourPosition[] => {
        const positions: HourPosition[] = [];
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
            {/* SVG for clock hands */}
            <svg
                style={{
                    height: '100%',
                    left: 0,
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    zIndex: 7,
                }}
                viewBox={`0 0 ${size} ${size}`}
            >
                {/* Hour hand */}
                <line
                    stroke="#333333"
                    strokeLinecap="round"
                    strokeWidth="6"
                    style={{ transition: 'transform 0.5s ease' }}
                    transform={`rotate(${handAngles.hourAngle} ${size / 2} ${size / 2})`}
                    x1={size / 2}
                    x2={size / 2}
                    y1={size / 2}
                    y2={size / 2 - size * 0.2}
                />

                {/* Minute hand */}
                <line
                    stroke="#555555"
                    strokeLinecap="round"
                    strokeWidth="4"
                    style={{ transition: 'transform 0.5s ease' }}
                    transform={`rotate(${handAngles.minuteAngle} ${size / 2} ${size / 2})`}
                    x1={size / 2}
                    x2={size / 2}
                    y1={size / 2}
                    y2={size / 2 - size * 0.3}
                />

                {/* Second hand (optional, for visual interest) */}
                <line
                    stroke="#ff4444"
                    strokeLinecap="round"
                    strokeWidth="2"
                    transform={`rotate(${currentTime.getSeconds() * 6} ${size / 2} ${size / 2})`}
                    x1={size / 2}
                    x2={size / 2}
                    y1={size / 2}
                    y2={size / 2 - size * 0.35}
                />
            </svg>

            {/* Central time display - smaller and lower z-index */}
            <div
                style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '16px',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 600,
                    left: '50%',
                    padding: '4px 12px',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 8,
                }}
            >
                {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })}
            </div>

            {/* Clock center dot */}
            <div
                style={{
                    background: 'var(--mantine-color-blue-6)',
                    borderRadius: '50%',
                    height: 16,
                    left: '50%',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 16,
                    zIndex: 9,
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
                        zIndex: 12,
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
