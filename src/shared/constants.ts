/**
 * Application-wide constants
 * This file contains constants that are used throughout the application
 * and should be managed from a single location.
 */

/**
 * The main application name
 */
export const APP_NAME = 'Listen Lounge';

/**
 * Application URLs and links
 */
export const APP_URLS = {
    GETTING_STARTED: 'https://github.com/jeffvli/feishin?tab=readme-ov-file#getting-started',
    GITHUB: 'https://github.com/jeffvli/feishin',
    GITHUB_DISCUSSIONS: 'https://github.com/jeffvli/feishin/discussions',
    GITHUB_ISSUES: 'https://github.com/jeffvli/feishin/issues',
    GITHUB_RELEASES: 'https://github.com/jeffvli/feishin/releases',
} as const;

/**
 * Discord Rich Presence constants
 */
export const DISCORD = {
    DEFAULT_APPLICATION_ID: '1165957668758900787',
} as const;

/**
 * Application client identifiers for different services
 */
export const CLIENT_IDENTIFIERS = {
    JELLYFIN: `MediaBrowser Client="${APP_NAME}"`,
    SUBSONIC: APP_NAME,
} as const;
