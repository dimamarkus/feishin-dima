# Feishin Developer Guide

## Overview

This guide provides detailed technical information for developers working on Feishin, particularly for implementing new features like the Record Labels system. It serves as an addendum to the main README and covers architectural patterns, best practices, and lessons learned from real feature implementation.

## Table of Contents

- [Project Architecture](#project-architecture)
- [Feature Development Patterns](#feature-development-patterns)
- [Working with Navidrome Integration](#working-with-navidrome-integration)
- [Virtual API Implementation](#virtual-api-implementation)
- [React Query Integration](#react-query-integration)
- [UI Component Patterns](#ui-component-patterns)
- [Router and Navigation](#router-and-navigation)
- [Development Workflow](#development-workflow)
- [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
- [Performance Considerations](#performance-considerations)

## Project Architecture

### High-Level Structure

Feishin is an Electron-based music player with a React frontend that communicates with music servers (primarily Navidrome and Jellyfin).

```
src/
├── main/           # Electron main process
├── preload/        # Electron preload scripts
├── remote/         # Web-only build
├── renderer/       # React frontend application
│   ├── api/        # API layer and controllers
│   ├── components/ # Reusable UI components
│   ├── features/   # Feature-based organization
│   ├── router/     # Application routing
│   ├── store/      # State management
│   └── utils/      # Utility functions
└── shared/         # Shared types and utilities
```

### Feature-Based Organization

Each major feature follows this structure:

```
src/renderer/features/[feature-name]/
├── api/           # API integration specific to this feature
├── components/    # UI components for this feature
├── queries/       # React Query hooks
├── routes/        # Route components
├── services/      # Business logic and data processing
└── index.ts       # Export all public interfaces
```

**Example**: The `labels` feature we implemented:
```
src/renderer/features/labels/
├── api/
│   └── virtual-label-api.ts
├── components/
│   └── label-list-content.tsx
├── queries/
│   ├── label-list-query.ts
│   └── label-detail-query.ts
├── routes/
│   └── label-list-route.tsx
└── services/
    └── label-aggregation.ts
```

## Feature Development Patterns

### 1. Research Phase

Before implementing any feature, understand the data flow:

**For Navidrome-backed features:**
1. Check if the server exposes the data directly via API endpoints
2. If not, check if the data exists in related endpoints (e.g., album metadata)
3. Understand the data structure and field naming conventions

**Example from Labels implementation:**
```typescript
// Labels aren't first-class entities in Navidrome
// But they exist in album.tags:
{
  "tags": {
    "label": ["Columbia"],
    "organization": ["Sony Music"],
    "publisher": ["Columbia Records"]
  }
}
```

### 2. Virtual API Pattern

When server APIs don't provide the exact data structure you need, implement a Virtual API:

```typescript
// src/renderer/features/labels/api/virtual-label-api.ts
export class VirtualLabelAPI {
    static async getLabelList(args: LabelListArgs): Promise<LabelListResponse> {
        // 1. Fetch raw data from server
        const albums = await this.getAllAlbums(args.apiClientProps);

        // 2. Process and aggregate client-side
        let labels = LabelAggregationService.extractLabelsFromAlbums(albums);

        // 3. Apply filtering, sorting, pagination
        if (args.query?.search) {
            labels = LabelAggregationService.filterLabels(labels, args.query.search);
        }

        // 4. Return in expected format
        return {
            items: labels,
            startIndex: args.query?.offset || 0,
            totalRecordCount: labels.length,
        };
    }
}
```

### 3. Service Layer Pattern

Separate data processing logic into service classes:

```typescript
// src/renderer/features/labels/services/label-aggregation.ts
export class LabelAggregationService {
    /**
     * Extract unique labels from album collection
     */
    static extractLabelsFromAlbums(albums: Album[]): Label[] {
        const labelMap = new Map<string, { name: string; albums: Album[] }>();

        albums.forEach((album) => {
            const labelName = this.getAlbumLabel(album);
            if (labelName) {
                const labelId = this.createLabelId(labelName);
                // Aggregate logic...
            }
        });

        return Array.from(labelMap.entries()).map(([labelId, data]) => ({
            id: labelId,
            name: data.name,
            albumCount: data.albums.length,
            albums: data.albums,
        }));
    }
}
```

## Working with Navidrome Integration

### Understanding Navidrome's Data Model

1. **First-class entities**: Album, Artist, Song, Genre, Playlist
   - Have dedicated API endpoints: `/album`, `/artist`, `/song`, etc.
   - Support pagination, filtering, sorting

2. **Metadata/Tags**: Custom fields stored in `tags` object
   - Accessed through album/song endpoints
   - Require client-side processing for browsing

3. **API Response Structure**:
```typescript
// Standard Navidrome list response
{
  "items": [/* entities */],
  "startIndex": 0,
  "totalRecordCount": 1234
}
```

### API Integration Patterns

**For existing endpoints:**
```typescript
// Use existing controller methods
const albums = await api.controller.getAlbumList({
    apiClientProps: { server, signal },
    query: {
        limit: 1000,
        sortBy: AlbumListSort.NAME,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
    },
});
```

**For virtual endpoints:**
```typescript
// Create your own API layer that processes existing data
export class VirtualLabelAPI {
    private static async getAllAlbums(apiClientProps: { server: ServerListItem; signal?: AbortSignal }) {
        const albumResponse = await api.controller.getAlbumList({
            apiClientProps,
            query: { limit: 1000, sortBy: AlbumListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
        });
        return albumResponse?.items || [];
    }
}
```

## Virtual API Implementation

### When to Use Virtual APIs

- Server doesn't provide the exact data structure needed
- Need to aggregate data from multiple sources
- Want to add computed fields or client-side processing
- Need to provide consistent interface regardless of server type

### Implementation Steps

1. **Define the interface** that consumers expect:
```typescript
export type LabelListResponse = {
    items: Label[];
    startIndex: number;
    totalRecordCount: number;
};
```

2. **Create the processing service**:
```typescript
export class LabelAggregationService {
    static extractLabelsFromAlbums(albums: Album[]): Label[] {
        // Processing logic
    }
}
```

3. **Implement the virtual API**:
```typescript
export class VirtualLabelAPI {
    static async getLabelList(args: LabelListArgs): Promise<LabelListResponse> {
        // Fetch -> Process -> Return
    }
}
```

4. **Add caching considerations**:
```typescript
// Use longer cache times since processing is expensive
staleTime: 1000 * 60 * 5, // 5 minutes
cacheTime: 1000 * 60 * 10, // 10 minutes
```

## React Query Integration

### Query Hook Patterns

Follow the established pattern for query hooks:

```typescript
// src/renderer/features/labels/queries/label-list-query.ts
export const useLabelList = (args: UseLabelListArgs) => {
    const { options, query, serverId } = args;
    const server = useCurrentServer();

    return useQuery({
        enabled: Boolean(server && serverId && options?.enabled !== false),
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not available');

            return VirtualLabelAPI.getLabelList({
                apiClientProps: { server, signal },
                query,
            });
        },
        queryKey: ['labels', 'list', serverId, query],
        cacheTime: options?.cacheTime,
        staleTime: options?.staleTime,
    });
};
```

### Query Key Strategies

**Simple approach** (used in labels implementation):
```typescript
queryKey: ['labels', 'list', serverId, query]
```

**Centralized approach** (recommended for larger features):
```typescript
// Add to src/renderer/api/query-keys.ts
labels: {
    list: (serverId: string, query?: LabelListQuery) => [serverId, 'labels', 'list', query] as const,
    detail: (serverId: string, labelId: string) => [serverId, 'labels', 'detail', labelId] as const,
}
```

### Cache Invalidation

```typescript
// Invalidate related queries when data changes
queryClient.invalidateQueries(['labels']);
queryClient.invalidateQueries(['albums']); // If labels affect album display
```

## UI Component Patterns

### Component Hierarchy

**List Views** typically follow this structure:
```
FeatureListRoute
├── FeatureListHeader (filters, sorting, search)
├── FeatureListContent (switching between grid/table)
    ├── FeatureListGridView (virtualized grid)
    └── FeatureListTableView (data table)
```

**Detail Views**:
```
FeatureDetailRoute
├── FeatureDetailHeader (title, actions)
└── FeatureDetailContent (main content)
```

### Styling Patterns

Use styled-components with CSS custom properties:

```typescript
const LabelCard = styled.div`
    background: var(--card-default-bg);
    border-radius: var(--card-default-radius);
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
        background: var(--card-default-bg-hover);
    }
`;
```

### Virtualization

For large lists, use the existing virtualization components:

```typescript
// For complex virtualized grids (follow existing pattern)
import { VirtualInfiniteGrid } from '/@/renderer/components/virtual-grid';

// For simple lists (labels implementation)
const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 20px;
`;
```

## Router and Navigation

### Adding New Routes

1. **Define routes** in `src/renderer/router/routes.ts`:
```typescript
export enum AppRoute {
    // ... existing routes
    LIBRARY_LABELS = '/library/labels',
    LIBRARY_LABELS_DETAIL = '/library/labels/:labelId',
    LIBRARY_LABELS_ALBUMS = '/library/labels/:labelId/albums',
}
```

2. **Add lazy imports** in `src/renderer/router/app-router.tsx`:
```typescript
const LabelListRoute = lazy(() => import('/@/renderer/features/labels/routes/label-list-route'));
```

3. **Configure routes**:
```typescript
<Route path={AppRoute.LIBRARY_LABELS}>
    <Route
        element={<LabelListRoute />}
        errorElement={<RouteErrorBoundary />}
        index
    />
    <Route
        element={<AlbumListRoute />}
        path={AppRoute.LIBRARY_LABELS_ALBUMS}
    />
</Route>
```

### Navigation Patterns

```typescript
// Programmatic navigation
const navigate = useNavigate();
const handleItemClick = useCallback((item: Label) => {
    navigate(generatePath('/labels/:labelId', { labelId: item.id }));
}, [navigate]);

// Route parameters
const { labelId } = useParams();
```

## Development Workflow

### 1. Code Organization

- **Follow feature-based structure**: Keep related code together
- **Use TypeScript**: Strong typing catches integration issues early
- **Implement incrementally**: Start with basic functionality, enhance progressively

### 2. Testing Approach

**Manual Testing Strategy:**
1. Create debug components to verify data flow
2. Test with real data from your music library
3. Verify edge cases (missing data, large datasets)

**Example debug component:**
```typescript
export const LabelTest = () => {
    useEffect(() => {
        const testAPI = async () => {
            const result = await VirtualLabelAPI.getLabelList({...});
            console.log('API Result:', result);
        };
        testAPI();
    }, []);

    return <div>Check console for results</div>;
};
```

### 3. Progressive Enhancement

**Phase 1**: Basic functionality
- Simple list view
- Basic data processing
- Manual route navigation

**Phase 2**: Enhanced UX
- Filters and sorting
- Search functionality
- Loading states

**Phase 3**: Integration
- Sidebar navigation
- Context menus
- Cross-feature linking

## Common Pitfalls and Solutions

### 1. React Query Infinite Loops

**Problem**: useEffect dependencies changing on every render
```typescript
// ❌ Wrong - server object recreated each render
useEffect(() => {
    fetchData();
}, [server]);

// ✅ Correct - use stable identifier
useEffect(() => {
    fetchData();
}, [server?.id]);
```

### 2. TypeScript Linting Issues

**Problem**: ESLint enforcing alphabetical order
```typescript
// ❌ Wrong order
export enum AppRoute {
    LIBRARY_LABELS_DETAIL = '/library/labels/:labelId',
    LIBRARY_LABELS_ALBUMS = '/library/labels/:labelId/albums',
}

// ✅ Correct order
export enum AppRoute {
    LIBRARY_LABELS_ALBUMS = '/library/labels/:labelId/albums',
    LIBRARY_LABELS_DETAIL = '/library/labels/:labelId',
}
```

### 3. Component Import Issues

**Problem**: Importing non-existent components
```typescript
// ❌ Wrong - Card component doesn't exist
import { Card } from '/@/renderer/components/card';

// ✅ Correct - Use existing components
import { Text } from '/@/renderer/components/text';
```

### 4. Virtual Grid Integration

**Problem**: VirtualInfiniteGrid has complex props interface
```typescript
// ❌ Complex - trying to use VirtualInfiniteGrid directly
<VirtualInfiniteGrid ItemComponent={...} />

// ✅ Simple - start with basic grid, enhance later
const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
`;
```

## Performance Considerations

### 1. Data Processing

**Cache processed results**:
```typescript
// Use React Query's built-in caching
const labelQuery = useLabelList({
    serverId: server?.id,
    options: {
        cacheTime: 1000 * 60 * 5, // 5 minutes
        staleTime: 1000 * 60 * 1, // 1 minute
    },
});
```

**Optimize data fetching**:
```typescript
// Fetch large batches to minimize requests
const albumResponse = await api.controller.getAlbumList({
    query: {
        limit: 1000, // Large batch
        startIndex: 0,
    },
});
```

### 2. UI Performance

**Use virtualization for large lists**:
- Simple grids: CSS Grid with reasonable limits
- Complex lists: VirtualInfiniteGrid component
- Tables: Follow existing table patterns

**Memoize expensive computations**:
```typescript
const processedData = useMemo(() => {
    return expensiveProcessing(rawData);
}, [rawData]);
```

### 3. Bundle Size

**Lazy load routes**:
```typescript
const LabelListRoute = lazy(() => import('/@/renderer/features/labels/routes/label-list-route'));
```

**Split large utilities**:
- Keep service classes focused and small
- Split complex processing into separate modules

## Advanced Patterns

### 1. Multi-Server Support

Consider different server types when implementing features:

```typescript
// Check server capabilities
if (server?.type === 'navidrome') {
    // Navidrome-specific logic
} else if (server?.type === 'jellyfin') {
    // Jellyfin-specific logic
}
```

### 2. Offline Support

For features that should work offline:

```typescript
const labelQuery = useLabelList({
    options: {
        staleTime: Infinity, // Never refetch
        cacheTime: Infinity, // Keep in cache forever
    },
});
```

### 3. Real-time Updates

For features that need real-time updates:

```typescript
// Invalidate queries on events
useEffect(() => {
    const handleLibraryUpdate = () => {
        queryClient.invalidateQueries(['labels']);
    };

    eventBus.on('library:updated', handleLibraryUpdate);
    return () => eventBus.off('library:updated', handleLibraryUpdate);
}, []);
```

## Conclusion

This guide represents lessons learned from implementing the Record Labels feature in Feishin. The patterns described here should serve as a foundation for implementing similar features.

Key takeaways:
1. **Understand the data first** - Research before coding
2. **Follow existing patterns** - Consistency is key
3. **Start simple** - Basic functionality first, enhance later
4. **Test incrementally** - Verify each piece as you build
5. **Think about performance** - Cache and virtualize appropriately

For questions or clarifications, refer to the existing codebase in `src/renderer/features/` for examples of these patterns in action.

## Related Documentation

- [Main README](./README.md) - Project setup and overview
- [Label Feature Implementation Plan](./LABEL_FEATURE_IMPLEMENTATION_PLAN.md) - Specific implementation details
- [Navidrome Documentation](https://www.navidrome.org/docs/) - Server API reference