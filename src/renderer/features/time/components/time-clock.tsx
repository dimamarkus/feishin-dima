import { Paper, Text, UnstyledButton } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
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

// Helper function to convert 12-hour format to 24-hour format
const convertTo24Hour = (hour12: number, period: 'am' | 'pm'): number => {
    if (period === 'am') {
        return hour12 === 12 ? 0 : hour12; // 12 AM is 00, 1 AM is 1, ...
    }
    // period === 'pm'
    return hour12 === 12 ? 12 : hour12 + 12; // 12 PM is 12, 1 PM is 13, ...
};

export const TimeClock = ({ size = 300 }: TimeClockProps) => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredHour, setHoveredHour] = useState<null | number>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isHoveringBlueArc, setIsHoveringBlueArc] = useState(false);
    const [isHoveringRedArc, setIsHoveringRedArc] = useState(false);
    const [showArcs, setShowArcs] = useState(false);
    const centerTimeRef = useRef<HTMLButtonElement>(null);

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Smooth arc appearance/disappearance
    useEffect(() => {
        if (isHovering && hoveredHour !== null) {
            // Small delay to create staggered effect
            const timer = setTimeout(() => {
                setShowArcs(true);
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setShowArcs(false);
        }
    }, [isHovering, hoveredHour]);

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

    // Handle center time click to navigate to current hour's playlist
    const handleCenterTimeClick = () => {
        const currentHour = currentTime.getHours();
        const playlistId = currentHour.toString().padStart(2, '0');
        navigate(`/library/time/${playlistId}`);
    };

    // Calculate which hour is being hovered based on mouse position
    const calculateHoveredHour = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = event.clientX - rect.left - centerX;
        const mouseY = event.clientY - rect.top - centerY;

        // Calculate angle from center to mouse position
        let angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
        // Adjust angle so 12 o'clock is 0 degrees
        angle = (angle + 90) % 360;
        if (angle < 0) angle += 360;

        // Convert angle to hour (1-12)
        const hourFloat = angle / 30;
        const hour = Math.round(hourFloat) % 12;
        return hour === 0 ? 12 : hour;
    };

    // Handle mouse move over clock
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (centerTimeRef.current) {
            const centerRect = centerTimeRef.current.getBoundingClientRect();
            const isOverCenter =
                event.clientX >= centerRect.left &&
                event.clientX <= centerRect.right &&
                event.clientY >= centerRect.top &&
                event.clientY <= centerRect.bottom;

            if (isOverCenter) {
                setHoveredHour(null);
                setIsHovering(false);
                return; // Don't proceed to calculate arc hover if over center
            }
        }

        const calculatedHour = calculateHoveredHour(event);
        setHoveredHour(calculatedHour);
        setIsHovering(true);
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setHoveredHour(null);
        setIsHovering(false);
        setIsHoveringBlueArc(false);
        setIsHoveringRedArc(false);
    };

    // Generate arc path for SVG - creates 2-hour spans
    const createArcPath = (startHour: number, endHour: number, radius: number) => {
        const centerX = size / 2;
        const centerY = size / 2;

        // Convert hours to angles (12 o'clock = -90 degrees)
        const startAngle = (startHour - 3) * 30 * (Math.PI / 180);
        const endAngle = (endHour - 3) * 30 * (Math.PI / 180);

        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);

        // Arcs are always 60 degrees (2 hours), so large-arc-flag is always 0
        const largeArcFlag = 0;

        return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    };

    // Helper function to normalize hour (handle 12-hour wraparound)
    const normalizeHour = (hour: number) => {
        if (hour <= 0) return hour + 12;
        if (hour > 12) return hour - 12;
        return hour;
    };

    // Handles click on an arc to navigate to a 2-hour time range page
    const handleArcNavigation = (firstHourInBlock12: number, period: 'am' | 'pm') => {
        const startHour24 = convertTo24Hour(firstHourInBlock12, period);
        const endHour24 = (startHour24 + 1) % 24; // The second hour in the 2-hour block

        const startPadded = startHour24.toString().padStart(2, '0');
        const endPadded = endHour24.toString().padStart(2, '0');

        navigate(`/library/time-range/${startPadded}-${endPadded}/${period}`);
    };

    // Common button style for AM/PM buttons
    const buttonBaseStyle = {
        alignItems: 'center',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        fontSize: '10px',
        fontWeight: 600,
        height: '22px',
        justifyContent: 'center',
        minWidth: '30px',
        opacity: 0.7,
        padding: '0 8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20,
    };

    return (
        <Paper
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            radius="xl"
            shadow="md"
            style={{
                background:
                    'radial-gradient(circle, var(--mantine-color-gray-0) 0%, var(--mantine-color-gray-1) 100%)',
                border: '8px solid var(--mantine-color-gray-3)',
                height: size,
                position: 'relative',
                transition: 'all 0.3s ease',
                width: size,
            }}
        >
            {/* SVG for hover arcs - zIndex: 7 */}
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
                {showArcs && hoveredHour !== null && (
                    <>
                        {/* Blue arc: H-1 to H+1 */}
                        <path
                            d={createArcPath(
                                normalizeHour(hoveredHour - 1),
                                normalizeHour(hoveredHour + 1),
                                (size - 90) / 2,
                            )}
                            fill="none"
                            onClick={() =>
                                hoveredHour !== null &&
                                handleArcNavigation(normalizeHour(hoveredHour - 1), 'am')
                            }
                            onMouseEnter={() => setIsHoveringBlueArc(true)}
                            onMouseLeave={() => setIsHoveringBlueArc(false)}
                            opacity={isHoveringBlueArc ? 0.4 : 0.3}
                            stroke="var(--primary-color)"
                            strokeWidth="32"
                            style={{
                                cursor: 'pointer',
                                filter: isHoveringBlueArc
                                    ? 'drop-shadow(0 0 8px var(--primary-color))'
                                    : 'none',
                                transition: 'opacity 0.2s ease, filter 0.3s ease',
                            }}
                        />

                        {/* Red arc: H-1 to H+1 */}
                        <path
                            d={createArcPath(
                                normalizeHour(hoveredHour - 1),
                                normalizeHour(hoveredHour + 1),
                                (size - 30) / 2,
                            )}
                            fill="none"
                            onClick={() =>
                                hoveredHour !== null &&
                                handleArcNavigation(normalizeHour(hoveredHour - 1), 'pm')
                            }
                            onMouseEnter={() => setIsHoveringRedArc(true)}
                            onMouseLeave={() => setIsHoveringRedArc(false)}
                            opacity={isHoveringRedArc ? 0.4 : 0.3}
                            stroke="var(--secondary-color)"
                            strokeWidth="32"
                            style={{
                                cursor: 'pointer',
                                filter: isHoveringRedArc
                                    ? 'drop-shadow(0 0 8px var(--secondary-color))'
                                    : 'none',
                                transition: 'opacity 0.2s ease, filter 0.3s ease',
                            }}
                        />
                    </>
                )}
            </svg>

            {/* SVG for clock hands */}
            <svg
                style={{
                    height: '100%',
                    left: 0,
                    pointerEvents: 'none', // Added to prevent hands from intercepting clicks
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    zIndex: 5, // Lower z-index so interactive elements can be above it
                }}
                viewBox={`0 0 ${size} ${size}`}
            >
                {/* Hour hand */}
                <line
                    stroke="#333333"
                    strokeLinecap="round"
                    strokeWidth="6"
                    style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
                    style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
                    style={{ transition: 'transform 0.1s ease-out' }}
                    transform={`rotate(${currentTime.getSeconds() * 6} ${size / 2} ${size / 2})`}
                    x1={size / 2}
                    x2={size / 2}
                    y1={size / 2}
                    y2={size / 2 - size * 0.35}
                />
            </svg>

            {/* Central time display - make clickable */}
            <UnstyledButton
                onClick={handleCenterTimeClick}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary-color)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 8px var(--primary-color))';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.filter = 'none';
                }}
                ref={centerTimeRef}
                style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 600,
                    left: '50%',
                    padding: '6px 14px',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'color 0.2s ease, filter 0.3s ease',
                    whiteSpace: 'nowrap',
                    zIndex: 20, // Higher z-index to ensure it's on top and clickable
                }}
            >
                {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })}
            </UnstyledButton>

            {/* Clock center dot */}
            <div
                style={{
                    background: 'var(--primary-color)',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    height: 16,
                    left: '50%',
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'all 0.3s ease',
                    width: 16,
                    zIndex: 8, // Raised to be above arcs, below hour markers
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
                        gap: 4,
                        height: 60,
                        justifyContent: 'center',
                        left: x - 30,
                        pointerEvents: 'none', // Allow clicks to pass through to arcs
                        position: 'absolute',
                        top: y - 30,
                        transition: 'all 0.3s ease',
                        width: 60,
                        zIndex: 15, // High z-index to ensure buttons are clickable
                    }}
                >
                    {/* Hour number */}
                    <Text
                        size="lg"
                        style={{
                            background: 'rgba(0, 0, 0, 0.75)', // Enhanced background
                            borderRadius: '6px', // Increased border radius
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                            color: 'var(--main-fg)',
                            padding: '3px 8px', // Increased padding
                            pointerEvents: 'auto', // Make text itself non-blocking if not interactive
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                        }}
                        weight={700}
                    >
                        {hour}
                    </Text>

                    {/* AM/PM buttons */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 6,
                            justifyContent: 'center',
                            pointerEvents: 'auto', // Make button container specifically clickable
                            width: '100%',
                        }}
                    >
                        {amPlaylist && (
                            <UnstyledButton
                                onClick={() => handleHourClick('am', hour)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    e.currentTarget.style.transform = 'scale(1.2)';
                                    e.currentTarget.style.boxShadow =
                                        '0 4px 12px rgba(53, 116, 252, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.7';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow =
                                        '0 2px 6px rgba(0, 0, 0, 0.1)';
                                }}
                                style={{
                                    ...buttonBaseStyle,
                                    background: 'rgba(0, 0, 0, 0.8)', // Enhanced background
                                    border: '1px solid rgba(53, 116, 252, 0.6)',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                                    color: 'var(--primary-color)',
                                    pointerEvents: 'auto', // Ensure buttons are clickable
                                }}
                            >
                                AM
                            </UnstyledButton>
                        )}
                        {pmPlaylist && (
                            <UnstyledButton
                                onClick={() => handleHourClick('pm', hour)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    e.currentTarget.style.transform = 'scale(1.2)';
                                    e.currentTarget.style.boxShadow =
                                        '0 4px 12px rgba(255, 120, 120, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.7';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow =
                                        '0 2px 6px rgba(0, 0, 0, 0.1)';
                                }}
                                style={{
                                    ...buttonBaseStyle,
                                    background: 'rgba(0, 0, 0, 0.8)', // Enhanced background
                                    border: '1px solid rgba(255, 120, 120, 0.6)',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                                    color: 'var(--secondary-color)',
                                    pointerEvents: 'auto', // Ensure buttons are clickable
                                }}
                            >
                                PM
                            </UnstyledButton>
                        )}
                    </div>
                </div>
            ))}

            {/* Clock tick marks */}
            {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const outerRadius = (size - 20) / 2;
                const innerRadius = outerRadius - 12;
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
                            background: 'var(--mantine-color-gray-5)',
                            borderRadius: '1px',
                            height: Math.abs(y2 - y1) || 3,
                            left: x1,
                            opacity: 0.6,
                            position: 'absolute',
                            top: y1,
                            transform: `rotate(${i * 30}deg)`,
                            transformOrigin: '0 0',
                            transition: 'all 0.3s ease',
                            width: Math.abs(x2 - x1) || 3,
                            zIndex: 4, // Lower than other elements
                        }}
                    />
                );
            })}
        </Paper>
    );
};
