export interface YearPlaylist {
    displayName: string;
    icon: string;
    id: string;
    releaseYearValue: number | number[];
    route: string;
    type: 'decade' | 'year';
}

// Predefined decade-based smart playlists
export const YEAR_DECADES: YearPlaylist[] = [
    {
        displayName: '1950s',
        icon: '🎭',
        id: 'year-1950s',
        releaseYearValue: [1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959],
        route: '/library/years/decade/1950s',
        type: 'decade',
    },
    {
        displayName: '1960s',
        icon: '🎸',
        id: 'year-1960s',
        releaseYearValue: [1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969],
        route: '/library/years/decade/1960s',
        type: 'decade',
    },
    {
        displayName: '1970s',
        icon: '🕺',
        id: 'year-1970s',
        releaseYearValue: [1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979],
        route: '/library/years/decade/1970s',
        type: 'decade',
    },
    {
        displayName: '1980s',
        icon: '📻',
        id: 'year-1980s',
        releaseYearValue: [1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989],
        route: '/library/years/decade/1980s',
        type: 'decade',
    },
    {
        displayName: '1990s',
        icon: '💿',
        id: 'year-1990s',
        releaseYearValue: [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
        route: '/library/years/decade/1990s',
        type: 'decade',
    },
    {
        displayName: '2000s',
        icon: '💽',
        id: 'year-2000s',
        releaseYearValue: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009],
        route: '/library/years/decade/2000s',
        type: 'decade',
    },
    {
        displayName: '2010s',
        icon: '🎵',
        id: 'year-2010s',
        releaseYearValue: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
        route: '/library/years/decade/2010s',
        type: 'decade',
    },
    {
        displayName: '2020s',
        icon: '🎶',
        id: 'year-2020s',
        releaseYearValue: [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029],
        route: '/library/years/decade/2020s',
        type: 'decade',
    },
];

// Generate individual years (1950-2024)
export const YEAR_INDIVIDUALS: YearPlaylist[] = [];

// Generate years from 1950 to current year + 1
const currentYear = new Date().getFullYear();
for (let year = 1950; year <= currentYear + 1; year++) {
    YEAR_INDIVIDUALS.push({
        displayName: year.toString(),
        icon: '📅',
        id: `year-${year}`,
        releaseYearValue: year,
        route: `/library/years/${year}`,
        type: 'year',
    });
}

// Combined list for export
export const YEAR_PLAYLISTS: YearPlaylist[] = [...YEAR_DECADES, ...YEAR_INDIVIDUALS];

// Helper function to get decade for a year
export const getDecadeForYear = (year: number): string => {
    const decade = Math.floor(year / 10) * 10;
    return `${decade}s`;
};

// Helper function to get years in a decade
export const getYearsInDecade = (decade: string): number[] => {
    const startYear = parseInt(decade.replace('s', ''));
    return Array.from({ length: 10 }, (_, i) => startYear + i);
};
