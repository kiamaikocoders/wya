# Bug Fixes Summary - January 2026

## Issues Fixed

### 1. ✅ RequestEvent.tsx:429 - previewUrl is not defined
**Issue**: `previewUrl` was referenced but not declared in state
**Fix**: Added `const [previewUrl, setPreviewUrl] = useState<string | null>(null);` and `const [isUploading, setIsUploading] = useState(false);` to RequestEvent component state

### 2. ✅ Overlapping text in Quick Actions (Admin Dashboard)
**Issue**: Text in Quick Actions cards was overlapping
**Fix**: 
- Increased `min-h-[100px]` to `min-h-[120px]` for all Quick Action buttons
- Added `line-clamp-2` to all description paragraphs to ensure text truncates properly

### 3. ✅ Outdated categories in Edit Event modal
**Issue**: Edit event modal showed hardcoded old categories instead of fetching from database
**Fix**: 
- Updated `AdminEditEvent.tsx` to fetch categories from database using `useQuery` (same pattern as `AdminCreateEvent.tsx`)
- Added hierarchical category display using Accordion component
- Added `Category` interface and `organizedCategories` useMemo

### 4. ✅ Event search and date format (mm/yyyy)
**Issue**: Too many events in dropdown, hard to find; date format not user-friendly
**Fix**: 
- Added search input field above event dropdown in `CreatePostModal.tsx`
- Changed date format from default locale format to `mm/yyyy` format (e.g., "01/2026")
- Added event filtering based on search query (searches title and location)
- Increased pageSize to 500 to ensure all events are loaded

### 5. ✅ Follow/unfollow success messages
**Issue**: Follow message showed "You are now following [followerName]" where followerName was the person doing the following, not the person being followed
**Fix**: 
- Updated `follow-notifications.ts` to fetch the followed user's profile
- Changed toast message to show the correct user: "You are now following ${followedName}"

### 6. ✅ Video thumbnails showing as black
**Issue**: Videos on user page (PostsGrid) and other places show black thumbnails
**Fix**: 
- Added `preload="metadata"` to video elements
- Added `onLoadedMetadata` handler to set `currentTime` to 0.5s (or 10% of duration) to show a video frame instead of black screen
- Applied to `PostsGrid.tsx` and `FriendActivitiesCarousel.tsx`
- Added `preload="metadata"` to `ContentCard.tsx` for Spotlight videos

## Issues Remaining/Needs Clarification

### 7. Video sound issue
**Status**: Needs clarification
**Issue**: User says "video uploaded but has no sound"
**Analysis**: 
- Videos in Spotlight feed are intentionally muted by default (TikTok-style autoplay behavior)
- Videos in grids/thumbnails are muted for performance
- Videos with `controls` attribute (like in modals) should have sound
**Possible Solutions**:
- Add unmute button/control for Spotlight videos (like TikTok)
- Ensure videos in modals/preview have sound enabled
- Verify video files actually contain audio tracks

### 8. Spotlight scrolling direction
**Status**: Needs investigation
**Issue**: User says "scrolling up not down, content starts from bottom"
**Analysis**: 
- SpotlightPage uses `overflow-y-auto` which should scroll normally (down)
- Scroll snapping is enabled with `scrollSnapType: 'y mandatory'`
- No explicit scroll position setting found
**Possible Solutions**:
- Ensure page scrolls to top on mount
- Check if any CSS is causing reverse scroll direction
- Verify scroll snapping isn't causing issues

### 9. Multiple categories tagging
**Status**: Needs clarification
**Issue**: User says "multiple categories tagging not being listed"
**Analysis**: 
- Current implementation allows selecting one category per event
- Unclear if user wants to:
  - Tag events with multiple categories
  - See all available categories (already implemented in edit modal)
  - Something else
**Action Required**: Clarify requirement
