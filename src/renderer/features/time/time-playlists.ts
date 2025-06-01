export interface TimePlaylist {
    displayName: string;
    icon: string;
    id: string;
    lyricistValue: string | string[];
    route: string;
    type: 'hour' | 'period';
}

// Predefined time-based smart playlists - Time Periods
export const TIME_PERIODS: TimePlaylist[] = [
    {
        displayName: 'Early Morning (5 AM - 8 AM)',
        icon: '🌅',
        id: 'time-early-morning',
        lyricistValue: ['5am', '6am', '7am', '8am'],
        route: '/library/time/early-morning',
        type: 'period',
    },
    {
        displayName: 'Morning (9 AM - 11 AM)',
        icon: '☀️',
        id: 'time-morning',
        lyricistValue: ['9am', '10am', '11am'],
        route: '/library/time/morning',
        type: 'period',
    },
    {
        displayName: 'Midday (12 PM - 2 PM)',
        icon: '🌞',
        id: 'time-midday',
        lyricistValue: ['12pm', '1pm', '2pm'],
        route: '/library/time/midday',
        type: 'period',
    },
    {
        displayName: 'Afternoon (3 PM - 5 PM)',
        icon: '🌤️',
        id: 'time-afternoon',
        lyricistValue: ['3pm', '4pm', '5pm'],
        route: '/library/time/afternoon',
        type: 'period',
    },
    {
        displayName: 'Evening (6 PM - 8 PM)',
        icon: '🌆',
        id: 'time-evening',
        lyricistValue: ['6pm', '7pm', '8pm'],
        route: '/library/time/evening',
        type: 'period',
    },
    {
        displayName: 'Night (9 PM - 11 PM)',
        icon: '🌙',
        id: 'time-night',
        lyricistValue: ['9pm', '10pm', '11pm'],
        route: '/library/time/night',
        type: 'period',
    },
    {
        displayName: 'Late Night (12 AM - 4 AM)',
        icon: '🌌',
        id: 'time-late-night',
        lyricistValue: ['12am', '1am', '2am', '3am', '4am'],
        route: '/library/time/late-night',
        type: 'period',
    },
];

// Individual hour options (24 hours)
export const TIME_HOURS: TimePlaylist[] = [
    {
        displayName: '12 AM (Midnight)',
        icon: '🕛',
        id: 'time-00',
        lyricistValue: '12am',
        route: '/library/time/00',
        type: 'hour',
    },
    {
        displayName: '1 AM',
        icon: '🕐',
        id: 'time-01',
        lyricistValue: '1am',
        route: '/library/time/01',
        type: 'hour',
    },
    {
        displayName: '2 AM',
        icon: '🕑',
        id: 'time-02',
        lyricistValue: '2am',
        route: '/library/time/02',
        type: 'hour',
    },
    {
        displayName: '3 AM',
        icon: '🕒',
        id: 'time-03',
        lyricistValue: '3am',
        route: '/library/time/03',
        type: 'hour',
    },
    {
        displayName: '4 AM',
        icon: '🕓',
        id: 'time-04',
        lyricistValue: '4am',
        route: '/library/time/04',
        type: 'hour',
    },
    {
        displayName: '5 AM',
        icon: '🕔',
        id: 'time-05',
        lyricistValue: '5am',
        route: '/library/time/05',
        type: 'hour',
    },
    {
        displayName: '6 AM',
        icon: '🕕',
        id: 'time-06',
        lyricistValue: '6am',
        route: '/library/time/06',
        type: 'hour',
    },
    {
        displayName: '7 AM',
        icon: '🕖',
        id: 'time-07',
        lyricistValue: '7am',
        route: '/library/time/07',
        type: 'hour',
    },
    {
        displayName: '8 AM',
        icon: '🕗',
        id: 'time-08',
        lyricistValue: '8am',
        route: '/library/time/08',
        type: 'hour',
    },
    {
        displayName: '9 AM',
        icon: '🕘',
        id: 'time-09',
        lyricistValue: '9am',
        route: '/library/time/09',
        type: 'hour',
    },
    {
        displayName: '10 AM',
        icon: '🕙',
        id: 'time-10',
        lyricistValue: '10am',
        route: '/library/time/10',
        type: 'hour',
    },
    {
        displayName: '11 AM',
        icon: '🕚',
        id: 'time-11',
        lyricistValue: '11am',
        route: '/library/time/11',
        type: 'hour',
    },
    {
        displayName: '12 PM (Noon)',
        icon: '🕛',
        id: 'time-12',
        lyricistValue: '12pm',
        route: '/library/time/12',
        type: 'hour',
    },
    {
        displayName: '1 PM',
        icon: '🕐',
        id: 'time-13',
        lyricistValue: '1pm',
        route: '/library/time/13',
        type: 'hour',
    },
    {
        displayName: '2 PM',
        icon: '🕑',
        id: 'time-14',
        lyricistValue: '2pm',
        route: '/library/time/14',
        type: 'hour',
    },
    {
        displayName: '3 PM',
        icon: '🕒',
        id: 'time-15',
        lyricistValue: '3pm',
        route: '/library/time/15',
        type: 'hour',
    },
    {
        displayName: '4 PM',
        icon: '🕓',
        id: 'time-16',
        lyricistValue: '4pm',
        route: '/library/time/16',
        type: 'hour',
    },
    {
        displayName: '5 PM',
        icon: '🕔',
        id: 'time-17',
        lyricistValue: '5pm',
        route: '/library/time/17',
        type: 'hour',
    },
    {
        displayName: '6 PM',
        icon: '🕕',
        id: 'time-18',
        lyricistValue: '6pm',
        route: '/library/time/18',
        type: 'hour',
    },
    {
        displayName: '7 PM',
        icon: '🕖',
        id: 'time-19',
        lyricistValue: '7pm',
        route: '/library/time/19',
        type: 'hour',
    },
    {
        displayName: '8 PM',
        icon: '🕗',
        id: 'time-20',
        lyricistValue: '8pm',
        route: '/library/time/20',
        type: 'hour',
    },
    {
        displayName: '9 PM',
        icon: '🕘',
        id: 'time-21',
        lyricistValue: '9pm',
        route: '/library/time/21',
        type: 'hour',
    },
    {
        displayName: '10 PM',
        icon: '🕙',
        id: 'time-22',
        lyricistValue: '10pm',
        route: '/library/time/22',
        type: 'hour',
    },
    {
        displayName: '11 PM',
        icon: '🕚',
        id: 'time-23',
        lyricistValue: '11pm',
        route: '/library/time/23',
        type: 'hour',
    },
];

// Combined list for export
export const TIME_PLAYLISTS: TimePlaylist[] = [...TIME_PERIODS, ...TIME_HOURS];

// Helper function to create smart playlist rule for time filtering
// export const createTimeSmartPlaylistRule = (timePlaylist: TimePlaylist) => {
//     return {
//         all: [
//             {
//                 contains: {
//                     lyricist: timePlaylist.lyricistValue,
//                 },
//             },
//         ],
//     };
// };

// Helper function to generate playlist body for creating time-based smart playlists
// export const createTimePlaylistBody = (timePlaylist: TimePlaylist) => {
//     return {
//         _custom: {
//             navidrome: {
//                 rules: {
//                     ...createTimeSmartPlaylistRule(timePlaylist),
//                     limit: 1000,
//                     order: 'asc',
//                     sort: 'title',
//                 },
//             },
//         },
//         comment: `Auto-generated smart playlist for ${timePlaylist.displayName}`,
//         name: timePlaylist.displayName,
//         public: false,
//     };
// };
