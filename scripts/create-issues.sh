#!/bin/bash

# GitHub Issue Creation Script with Rate Limiting
# Respects GitHub API rate limits (5000 requests/hour for authenticated users)
# Creates issues with 2 second delay between each to be safe

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Rate limiting settings
DELAY_BETWEEN_ISSUES=2  # seconds between issue creation
BATCH_SIZE=10           # issues per batch
BATCH_DELAY=10          # seconds between batches

# Counter
ISSUE_COUNT=0
BATCH_COUNT=0

# Function to create an issue with rate limiting
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"

    ISSUE_COUNT=$((ISSUE_COUNT + 1))

    echo -e "${BLUE}[$ISSUE_COUNT]${NC} Creating: ${YELLOW}$title${NC}"

    if [ -n "$labels" ]; then
        gh issue create --title "$title" --body "$body" --label "$labels" 2>/dev/null || {
            # If label doesn't exist, create without label
            gh issue create --title "$title" --body "$body"
        }
    else
        gh issue create --title "$title" --body "$body"
    fi

    echo -e "${GREEN}✓ Created issue #$ISSUE_COUNT${NC}"

    # Rate limiting
    sleep $DELAY_BETWEEN_ISSUES

    # Batch delay
    if [ $((ISSUE_COUNT % BATCH_SIZE)) -eq 0 ]; then
        BATCH_COUNT=$((BATCH_COUNT + 1))
        echo -e "${YELLOW}Batch $BATCH_COUNT complete. Waiting ${BATCH_DELAY}s before next batch...${NC}"
        sleep $BATCH_DELAY
    fi
}

# Check authentication
echo -e "${BLUE}Checking GitHub authentication...${NC}"
if ! gh auth status &>/dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub. Run: gh auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated with GitHub${NC}"
echo -e "${BLUE}Starting issue creation...${NC}"
echo ""

# ============================================================
# EPIC: Project Setup & Infrastructure
# ============================================================

create_issue "[Epic] Project Setup & Infrastructure" \
"## Overview
Set up the foundational project structure, tooling, and CI/CD pipeline.

## Goals
- Monorepo structure with Turborepo
- TypeScript configuration
- Linting and formatting
- CI/CD pipeline
- Environment configuration

## Related Issues
- Project initialization
- TypeScript setup
- ESLint/Prettier configuration
- GitHub Actions workflows" \
"epic,infrastructure"

create_issue "[Setup] Initialize Turborepo monorepo structure" \
"## Description
Set up the monorepo using Turborepo with proper workspace configuration.

## Tasks
- [x] Create root package.json with workspaces
- [x] Configure turbo.json
- [x] Set up apps/web directory
- [x] Set up packages directory for shared code
- [x] Add packageManager field

## Acceptance Criteria
- \`npm run dev\` starts all apps
- \`npm run build\` builds all packages
- Proper caching configured" \
"setup,infrastructure"

create_issue "[Setup] Configure TypeScript for strict type checking" \
"## Description
Set up TypeScript with strict configuration for type safety.

## Tasks
- [x] Create tsconfig.json in root
- [x] Create tsconfig.json for web app
- [x] Configure strict mode
- [ ] Add path aliases
- [ ] Configure for shared packages

## Acceptance Criteria
- \`npm run type-check\` passes
- No implicit any errors
- Strict null checks enabled" \
"setup,typescript"

create_issue "[Setup] Configure ESLint and Prettier" \
"## Description
Set up linting and code formatting for consistent code style.

## Tasks
- [ ] Install ESLint with TypeScript support
- [ ] Install Prettier
- [ ] Configure ESLint rules
- [ ] Add Prettier configuration
- [ ] Add lint-staged for pre-commit hooks
- [ ] Add husky for git hooks

## Acceptance Criteria
- \`npm run lint\` checks all files
- \`npm run format\` formats code
- Pre-commit hook runs lint" \
"setup,dx"

create_issue "[Setup] Create GitHub Actions CI/CD workflow" \
"## Description
Set up automated testing and deployment pipeline.

## Tasks
- [ ] Create CI workflow for PRs
- [ ] Add type checking step
- [ ] Add linting step
- [ ] Add build step
- [ ] Add test step (when tests exist)
- [ ] Create CD workflow for deployments

## Acceptance Criteria
- PRs are automatically checked
- Main branch deployments work
- Status checks required for merge" \
"setup,ci-cd"

create_issue "[Setup] Configure environment variables management" \
"## Description
Set up secure environment variable handling.

## Tasks
- [x] Create .env.example files
- [x] Add .env to .gitignore
- [ ] Document all required env vars
- [ ] Add validation for required env vars
- [ ] Set up different env files for dev/staging/prod

## Acceptance Criteria
- No secrets in repo
- Clear documentation for setup
- Runtime validation of required vars" \
"setup,security"

# ============================================================
# EPIC: Google OAuth & Authentication
# ============================================================

create_issue "[Epic] Google OAuth & Authentication" \
"## Overview
Implement secure Google OAuth authentication flow.

## Goals
- Google OAuth 2.0 login
- Secure token management
- Session persistence
- Proper scopes for Classroom API

## Security Considerations
- Token storage security
- CSRF protection
- Secure cookie handling" \
"epic,authentication"

create_issue "[Auth] Implement Google OAuth login flow" \
"## Description
Create the Google OAuth authentication flow using @react-oauth/google.

## Tasks
- [x] Install @react-oauth/google
- [x] Create GoogleOAuthProvider wrapper
- [x] Implement login button with useGoogleLogin
- [x] Handle OAuth callback
- [x] Fetch user profile information

## Acceptance Criteria
- Users can sign in with Google
- User profile displayed after login
- Proper error handling for failed auth" \
"authentication,feature"

create_issue "[Auth] Implement token refresh mechanism" \
"## Description
Handle OAuth token expiration and refresh.

## Tasks
- [ ] Detect token expiration
- [ ] Implement silent token refresh
- [ ] Handle refresh failures gracefully
- [ ] Re-prompt user login if refresh fails

## Acceptance Criteria
- Tokens refresh automatically
- No interruption for users
- Clear UX when re-auth needed" \
"authentication,feature"

create_issue "[Auth] Add session persistence" \
"## Description
Persist user session across page reloads.

## Tasks
- [ ] Store auth state securely
- [ ] Restore session on app load
- [ ] Handle session expiration
- [ ] Add \"remember me\" option

## Acceptance Criteria
- Users stay logged in after reload
- Sessions expire appropriately
- Secure storage mechanism" \
"authentication,feature"

create_issue "[Auth] Implement logout functionality" \
"## Description
Create proper logout flow that cleans up all auth state.

## Tasks
- [x] Create logout button
- [x] Clear local auth state
- [ ] Revoke Google OAuth token
- [ ] Clear any cached data
- [ ] Redirect to login page

## Acceptance Criteria
- Clean logout experience
- All tokens invalidated
- No residual user data" \
"authentication,feature"

create_issue "[Auth] Add authentication guards for protected routes" \
"## Description
Protect routes that require authentication.

## Tasks
- [ ] Create AuthGuard component
- [ ] Redirect unauthenticated users
- [ ] Show loading state during auth check
- [ ] Handle deep linking for auth redirects

## Acceptance Criteria
- Protected routes require auth
- Proper redirect flow
- No flash of protected content" \
"authentication,feature"

# ============================================================
# EPIC: Google Classroom API Integration
# ============================================================

create_issue "[Epic] Google Classroom API Integration" \
"## Overview
Integrate with Google Classroom API for reading and managing classroom data.

## Goals
- List courses/classes
- View student rosters
- Create and update courses
- Manage enrollments

## API Scopes Required
- classroom.courses.readonly
- classroom.rosters.readonly
- classroom.profile.emails
- classroom.profile.photos" \
"epic,google-classroom"

create_issue "[GC-API] Set up Google API client initialization" \
"## Description
Initialize the Google API (gapi) client for Classroom API access.

## Tasks
- [x] Load gapi script dynamically
- [x] Initialize gapi.client
- [x] Configure discovery docs
- [x] Set access token after auth

## Acceptance Criteria
- GAPI loads without errors
- Client ready for API calls
- Token properly configured" \
"google-classroom,api"

create_issue "[GC-API] Implement courses list API" \
"## Description
Fetch all courses the user has access to.

## Tasks
- [x] Create getCourses function
- [x] Handle pagination
- [x] Filter by course state
- [ ] Add caching
- [ ] Add error handling with retry

## Acceptance Criteria
- All courses retrieved
- Pagination works
- Proper error messages" \
"google-classroom,api"

create_issue "[GC-API] Implement students roster API" \
"## Description
Fetch students enrolled in a specific course.

## Tasks
- [x] Create getStudents function
- [x] Handle pagination
- [x] Include profile information
- [ ] Add caching
- [ ] Add error handling with retry

## Acceptance Criteria
- All students retrieved
- Profile photos/emails included
- Proper error messages" \
"google-classroom,api"

create_issue "[GC-API] Implement teachers roster API" \
"## Description
Fetch teachers assigned to a specific course.

## Tasks
- [ ] Create getTeachers function
- [ ] Handle pagination
- [ ] Include profile information
- [ ] Add caching

## Acceptance Criteria
- All teachers retrieved
- Profile info included
- Proper error messages" \
"google-classroom,api"

create_issue "[GC-API] Implement course creation API" \
"## Description
Create new courses in Google Classroom.

## Tasks
- [ ] Create createCourse function
- [ ] Handle required fields
- [ ] Validate input data
- [ ] Return created course

## Acceptance Criteria
- Courses created successfully
- Validation errors handled
- Created course returned" \
"google-classroom,api"

create_issue "[GC-API] Implement course update API" \
"## Description
Update existing course details.

## Tasks
- [ ] Create updateCourse function
- [ ] Handle partial updates
- [ ] Validate changes
- [ ] Return updated course

## Acceptance Criteria
- Courses updated successfully
- Partial updates work
- Validation errors handled" \
"google-classroom,api"

create_issue "[GC-API] Implement student enrollment API" \
"## Description
Enroll students in courses.

## Tasks
- [ ] Create enrollStudent function
- [ ] Handle enrollment codes
- [ ] Validate student exists
- [ ] Handle already enrolled case

## Acceptance Criteria
- Students enrolled successfully
- Duplicate enrollment handled
- Proper error messages" \
"google-classroom,api"

create_issue "[GC-API] Implement student removal API" \
"## Description
Remove students from courses.

## Tasks
- [ ] Create removeStudent function
- [ ] Handle confirmation
- [ ] Validate permissions
- [ ] Clean up associated data

## Acceptance Criteria
- Students removed successfully
- Proper confirmation flow
- Permission errors handled" \
"google-classroom,api"

create_issue "[GC-API] Implement batch operations for students" \
"## Description
Support batch enrollment/removal of students.

## Tasks
- [ ] Create batch enrollment function
- [ ] Create batch removal function
- [ ] Handle partial failures
- [ ] Report progress and results

## Acceptance Criteria
- Batch operations work
- Partial failures reported
- Progress visible to user" \
"google-classroom,api"

create_issue "[GC-API] Add API response caching" \
"## Description
Cache API responses to reduce API calls and improve performance.

## Tasks
- [ ] Implement cache storage
- [ ] Add cache invalidation
- [ ] Configure TTL per resource type
- [ ] Add manual cache refresh

## Acceptance Criteria
- Repeated calls use cache
- Cache invalidates properly
- Manual refresh works" \
"google-classroom,performance"

create_issue "[GC-API] Implement API error handling and retry logic" \
"## Description
Handle API errors gracefully with automatic retry.

## Tasks
- [ ] Create error handling wrapper
- [ ] Implement exponential backoff
- [ ] Handle rate limiting (429)
- [ ] Handle quota exceeded
- [ ] Log errors for debugging

## Acceptance Criteria
- Transient errors retried
- Rate limits respected
- Clear error messages" \
"google-classroom,api"

# ============================================================
# EPIC: Frontline TEAMS Integration
# ============================================================

create_issue "[Epic] Frontline TEAMS Integration" \
"## Overview
Integrate with Frontline TEAMS SIS for importing roster data.

## Goals
- Connect to Frontline API (if available)
- Import CSV roster exports
- Support OneRoster format
- Map data to Google Classroom schema

## Data Sources
- Frontline TEAMS API
- CSV exports
- OneRoster API/CSV" \
"epic,frontline"

create_issue "[Frontline] Research and document Frontline TEAMS API" \
"## Description
Research available API options for Frontline TEAMS integration.

## Tasks
- [ ] Contact Frontline support for API documentation
- [ ] Document available endpoints
- [ ] Document authentication methods
- [ ] Document rate limits
- [ ] Create API client specification

## Questions to Answer
- Does Frontline TEAMS have a REST API?
- What authentication is required (API key, OAuth)?
- Is OneRoster API supported?
- What data can be exported?

## Acceptance Criteria
- API documentation gathered
- Authentication method confirmed
- Data model understood" \
"frontline,research"

create_issue "[Frontline] Implement CSV import parser" \
"## Description
Parse CSV exports from Frontline TEAMS.

## Tasks
- [ ] Create CSV parser utility
- [ ] Handle different CSV formats
- [ ] Validate CSV structure
- [ ] Map columns to data model
- [ ] Handle encoding issues

## Acceptance Criteria
- CSV files parse correctly
- Validation errors reported
- Data mapped properly" \
"frontline,feature"

create_issue "[Frontline] Create Frontline data models" \
"## Description
Define TypeScript types for Frontline TEAMS data.

## Tasks
- [ ] Create Student type
- [ ] Create Teacher type
- [ ] Create Course/Class type
- [ ] Create Enrollment type
- [ ] Create School/District type

## Acceptance Criteria
- Types match Frontline schema
- Proper validation
- Documentation included" \
"frontline,types"

create_issue "[Frontline] Implement OneRoster CSV format support" \
"## Description
Support OneRoster 1.1 CSV format for roster imports.

## Tasks
- [ ] Parse users.csv
- [ ] Parse orgs.csv
- [ ] Parse classes.csv
- [ ] Parse enrollments.csv
- [ ] Parse courses.csv
- [ ] Validate against OneRoster spec

## OneRoster Files
- users.csv - Students and staff
- orgs.csv - Schools and districts
- classes.csv - Class sections
- enrollments.csv - Class memberships
- courses.csv - Course catalog

## Acceptance Criteria
- All OneRoster files parsed
- Validation against spec
- Clear error messages" \
"frontline,oneroster"

create_issue "[Frontline] Implement OneRoster API client" \
"## Description
Connect to OneRoster 1.1 REST API if available.

## Tasks
- [ ] Create API client class
- [ ] Implement OAuth 2.0 auth
- [ ] Implement getAllUsers endpoint
- [ ] Implement getAllClasses endpoint
- [ ] Implement getEnrollmentsForClass endpoint
- [ ] Handle pagination

## Acceptance Criteria
- API client connects successfully
- All required endpoints work
- Pagination handled" \
"frontline,oneroster,api"

create_issue "[Frontline] Create data transformation layer" \
"## Description
Transform Frontline data to Google Classroom format.

## Tasks
- [ ] Map student fields
- [ ] Map teacher fields
- [ ] Map course/class fields
- [ ] Handle missing data
- [ ] Validate transformed data

## Field Mappings
- Frontline studentId → Google userId
- Frontline className → Google course.name
- etc.

## Acceptance Criteria
- Data transforms correctly
- Missing data handled
- Validation passes" \
"frontline,data"

create_issue "[Frontline] Implement file upload interface" \
"## Description
Create UI for uploading Frontline CSV exports.

## Tasks
- [ ] Create file upload component
- [ ] Support drag and drop
- [ ] Validate file types
- [ ] Show upload progress
- [ ] Preview parsed data

## Acceptance Criteria
- Files upload successfully
- Validation feedback shown
- Data preview available" \
"frontline,ui"

create_issue "[Frontline] Add scheduled import support" \
"## Description
Support scheduled/automated CSV imports.

## Tasks
- [ ] Create import job scheduler
- [ ] Monitor import directory
- [ ] Process files automatically
- [ ] Send notifications on completion
- [ ] Handle import failures

## Acceptance Criteria
- Scheduled imports work
- Failures handled gracefully
- Notifications sent" \
"frontline,feature"

# ============================================================
# EPIC: Data Sync Engine
# ============================================================

create_issue "[Epic] Data Sync Engine" \
"## Overview
Build the core sync engine to synchronize data between Frontline TEAMS and Google Classroom.

## Goals
- Compare source and destination data
- Detect additions, updates, deletions
- Apply changes with verification
- Handle conflicts
- Provide sync reports

## Sync Modes
- Full sync
- Incremental sync
- Preview/dry run
- Selective sync" \
"epic,sync"

create_issue "[Sync] Design sync data model and state machine" \
"## Description
Design the data model for tracking sync state and operations.

## Tasks
- [ ] Define sync job schema
- [ ] Define sync operation schema
- [ ] Define sync result schema
- [ ] Design state machine for sync lifecycle
- [ ] Document sync states

## Sync States
- PENDING
- IN_PROGRESS
- COMPLETED
- FAILED
- CANCELLED

## Acceptance Criteria
- Data model documented
- State transitions defined
- Edge cases handled" \
"sync,design"

create_issue "[Sync] Implement data comparison algorithm" \
"## Description
Compare Frontline and Google Classroom data to detect changes.

## Tasks
- [ ] Create comparison function
- [ ] Detect new records
- [ ] Detect updated records
- [ ] Detect deleted records
- [ ] Handle fuzzy matching (name variations)

## Acceptance Criteria
- Changes detected accurately
- Fuzzy matching works
- Performance acceptable" \
"sync,algorithm"

create_issue "[Sync] Implement sync preview/dry run mode" \
"## Description
Show what changes would be made without applying them.

## Tasks
- [ ] Create preview function
- [ ] Generate change summary
- [ ] Show detailed diff
- [ ] Estimate API calls needed
- [ ] Allow selective approval

## Acceptance Criteria
- Preview shows accurate changes
- No data modified
- User can approve selectively" \
"sync,feature"

create_issue "[Sync] Implement student sync operations" \
"## Description
Sync student data from Frontline to Google Classroom.

## Tasks
- [ ] Create new students in Classroom
- [ ] Update existing student info
- [ ] Handle student departures
- [ ] Manage class enrollments
- [ ] Handle enrollment changes

## Acceptance Criteria
- Students synced correctly
- Enrollments updated
- Departures handled" \
"sync,feature"

create_issue "[Sync] Implement course/class sync operations" \
"## Description
Sync course/class data from Frontline to Google Classroom.

## Tasks
- [ ] Create new courses
- [ ] Update course details
- [ ] Archive old courses
- [ ] Handle section changes
- [ ] Manage teacher assignments

## Acceptance Criteria
- Courses synced correctly
- Sections handled
- Teachers assigned" \
"sync,feature"

create_issue "[Sync] Implement batch sync with progress tracking" \
"## Description
Execute sync operations in batches with progress reporting.

## Tasks
- [ ] Create batch processor
- [ ] Track progress percentage
- [ ] Report items processed
- [ ] Handle batch failures
- [ ] Support pause/resume

## Acceptance Criteria
- Batch processing works
- Progress accurate
- Pause/resume works" \
"sync,feature"

create_issue "[Sync] Implement sync conflict resolution" \
"## Description
Handle conflicts when data differs between systems.

## Tasks
- [ ] Detect conflicts
- [ ] Define conflict types
- [ ] Implement resolution strategies
- [ ] Allow manual resolution
- [ ] Log conflict decisions

## Conflict Strategies
- Source wins (Frontline)
- Destination wins (Google)
- Most recent wins
- Manual resolution

## Acceptance Criteria
- Conflicts detected
- Strategies work
- Manual option available" \
"sync,feature"

create_issue "[Sync] Implement sync verification and rollback" \
"## Description
Verify sync results and support rollback if needed.

## Tasks
- [ ] Verify changes applied
- [ ] Create sync checkpoints
- [ ] Implement rollback function
- [ ] Log all changes for audit
- [ ] Generate verification report

## Acceptance Criteria
- Changes verified
- Rollback works
- Audit trail complete" \
"sync,feature"

create_issue "[Sync] Create sync scheduling and automation" \
"## Description
Allow scheduling of automatic sync operations.

## Tasks
- [ ] Create scheduler interface
- [ ] Support cron-like scheduling
- [ ] Handle timezone issues
- [ ] Send sync notifications
- [ ] Retry failed syncs

## Acceptance Criteria
- Scheduled syncs run
- Notifications sent
- Failures retried" \
"sync,feature"

create_issue "[Sync] Implement sync history and audit log" \
"## Description
Track all sync operations for auditing and troubleshooting.

## Tasks
- [ ] Log all sync operations
- [ ] Store sync results
- [ ] Create history viewer
- [ ] Support filtering/search
- [ ] Export audit logs

## Acceptance Criteria
- All operations logged
- History viewable
- Logs exportable" \
"sync,audit"

# ============================================================
# EPIC: User Interface Components
# ============================================================

create_issue "[Epic] User Interface Components" \
"## Overview
Build the React UI components for the application.

## Goals
- Clean, modern design
- Responsive layout
- Accessible components
- Consistent styling

## Design System
- Use consistent color palette
- Standard spacing/sizing
- Reusable components" \
"epic,ui"

create_issue "[UI] Create Login component with Google branding" \
"## Description
Build the login page with proper Google sign-in branding.

## Tasks
- [x] Create Login component
- [x] Add Google sign-in button
- [ ] Follow Google branding guidelines
- [ ] Add loading state
- [ ] Add error display

## Acceptance Criteria
- Follows Google guidelines
- Clean design
- Error states handled" \
"ui,authentication"

create_issue "[UI] Create Dashboard layout component" \
"## Description
Build the main dashboard layout with navigation.

## Tasks
- [x] Create Dashboard component
- [x] Add user info header
- [ ] Add navigation menu
- [ ] Add breadcrumbs
- [ ] Make responsive

## Acceptance Criteria
- Clean layout
- Navigation works
- Responsive design" \
"ui,dashboard"

create_issue "[UI] Create ClassList component with cards" \
"## Description
Display courses in a card grid layout.

## Tasks
- [x] Create ClassList component
- [x] Create class cards
- [x] Add color coding
- [ ] Add search/filter
- [ ] Add sorting options
- [ ] Add loading skeleton

## Acceptance Criteria
- Courses displayed nicely
- Search/filter works
- Loading state shown" \
"ui,courses"

create_issue "[UI] Create StudentList component" \
"## Description
Display students in a list with avatars.

## Tasks
- [x] Create StudentList component
- [x] Show student avatars
- [x] Show email addresses
- [ ] Add search/filter
- [ ] Add bulk selection
- [ ] Add sorting

## Acceptance Criteria
- Students displayed nicely
- Search works
- Selection works" \
"ui,students"

create_issue "[UI] Create data table component" \
"## Description
Build a reusable data table for various data views.

## Tasks
- [ ] Create DataTable component
- [ ] Support sorting
- [ ] Support filtering
- [ ] Support pagination
- [ ] Support row selection
- [ ] Support column resizing

## Acceptance Criteria
- Table is reusable
- All features work
- Good performance" \
"ui,component"

create_issue "[UI] Create sync status dashboard" \
"## Description
Build a dashboard showing sync status and progress.

## Tasks
- [ ] Show last sync time
- [ ] Show sync progress
- [ ] Show sync statistics
- [ ] Show error summary
- [ ] Add manual sync button

## Acceptance Criteria
- Status clearly shown
- Progress accurate
- Errors visible" \
"ui,sync"

create_issue "[UI] Create sync preview/diff view" \
"## Description
Show changes that will be made during sync.

## Tasks
- [ ] Create diff component
- [ ] Show additions (green)
- [ ] Show removals (red)
- [ ] Show updates (yellow)
- [ ] Allow selective approval
- [ ] Show summary stats

## Acceptance Criteria
- Changes clearly shown
- Color coding works
- Selection works" \
"ui,sync"

create_issue "[UI] Create import wizard component" \
"## Description
Build a step-by-step wizard for data imports.

## Tasks
- [ ] Create wizard framework
- [ ] Step 1: File upload
- [ ] Step 2: Column mapping
- [ ] Step 3: Data preview
- [ ] Step 4: Confirmation
- [ ] Step 5: Results

## Acceptance Criteria
- Wizard flow works
- Can go back/forward
- Validation at each step" \
"ui,import"

create_issue "[UI] Create settings/configuration page" \
"## Description
Build settings page for app configuration.

## Tasks
- [ ] Create Settings component
- [ ] Sync preferences section
- [ ] Notification settings
- [ ] API configuration
- [ ] Account management

## Acceptance Criteria
- Settings saveable
- Changes apply
- Validation works" \
"ui,settings"

create_issue "[UI] Implement toast notifications" \
"## Description
Add toast notifications for user feedback.

## Tasks
- [ ] Create Toast component
- [ ] Support success/error/warning/info
- [ ] Support auto-dismiss
- [ ] Support manual dismiss
- [ ] Queue multiple toasts

## Acceptance Criteria
- Toasts display properly
- Types styled correctly
- Auto-dismiss works" \
"ui,component"

create_issue "[UI] Implement modal/dialog system" \
"## Description
Create reusable modal dialogs.

## Tasks
- [ ] Create Modal component
- [ ] Support different sizes
- [ ] Add close button
- [ ] Handle ESC key
- [ ] Block background scroll

## Acceptance Criteria
- Modals work properly
- Keyboard accessible
- Focus trapped" \
"ui,component"

create_issue "[UI] Add loading states and skeletons" \
"## Description
Add loading indicators throughout the app.

## Tasks
- [ ] Create Spinner component
- [ ] Create Skeleton component
- [ ] Add to course list
- [ ] Add to student list
- [ ] Add to sync operations

## Acceptance Criteria
- Loading clearly shown
- Skeletons match layout
- No layout shift" \
"ui,ux"

create_issue "[UI] Implement error boundaries and error pages" \
"## Description
Handle errors gracefully with error boundaries.

## Tasks
- [ ] Create ErrorBoundary component
- [ ] Create error page designs
- [ ] Add retry functionality
- [ ] Log errors for debugging
- [ ] Show helpful messages

## Acceptance Criteria
- Errors caught properly
- User can retry
- Errors logged" \
"ui,error-handling"

create_issue "[UI] Make application fully responsive" \
"## Description
Ensure app works well on all screen sizes.

## Tasks
- [ ] Test on mobile devices
- [ ] Adjust layouts for tablet
- [ ] Handle touch interactions
- [ ] Test navigation on mobile
- [ ] Fix any overflow issues

## Acceptance Criteria
- Works on mobile
- Works on tablet
- No horizontal scroll" \
"ui,responsive"

create_issue "[UI] Implement dark mode support" \
"## Description
Add dark mode theme option.

## Tasks
- [ ] Create dark color palette
- [ ] Add theme toggle
- [ ] Store preference
- [ ] Respect system preference
- [ ] Style all components

## Acceptance Criteria
- Dark mode works
- Toggle persists
- All components styled" \
"ui,feature"

# ============================================================
# EPIC: Testing & Quality
# ============================================================

create_issue "[Epic] Testing & Quality Assurance" \
"## Overview
Implement comprehensive testing strategy.

## Goals
- Unit tests for utilities
- Integration tests for API
- E2E tests for workflows
- Performance testing
- Accessibility testing

## Tools
- Vitest for unit tests
- Playwright for E2E
- Lighthouse for performance" \
"epic,testing"

create_issue "[Test] Set up Vitest for unit testing" \
"## Description
Configure Vitest as the testing framework.

## Tasks
- [ ] Install Vitest
- [ ] Configure vitest.config.ts
- [ ] Set up test utilities
- [ ] Add coverage reporting
- [ ] Add to CI pipeline

## Acceptance Criteria
- Tests run with \`npm test\`
- Coverage reports generated
- CI runs tests" \
"testing,setup"

create_issue "[Test] Write unit tests for Google API utilities" \
"## Description
Test the Google Classroom API utility functions.

## Tasks
- [ ] Test getCourses function
- [ ] Test getStudents function
- [ ] Test error handling
- [ ] Mock API responses
- [ ] Test pagination logic

## Acceptance Criteria
- All functions tested
- Edge cases covered
- Mocks work properly" \
"testing,api"

create_issue "[Test] Write unit tests for data transformation" \
"## Description
Test the Frontline to Google data transformation.

## Tasks
- [ ] Test field mappings
- [ ] Test validation logic
- [ ] Test edge cases
- [ ] Test error handling
- [ ] Test with real sample data

## Acceptance Criteria
- Transformations tested
- Edge cases covered
- Sample data works" \
"testing,data"

create_issue "[Test] Write unit tests for sync engine" \
"## Description
Test the core sync engine logic.

## Tasks
- [ ] Test comparison algorithm
- [ ] Test conflict detection
- [ ] Test resolution strategies
- [ ] Test batch processing
- [ ] Test rollback logic

## Acceptance Criteria
- All scenarios tested
- Edge cases covered
- Logic verified" \
"testing,sync"

create_issue "[Test] Set up Playwright for E2E testing" \
"## Description
Configure Playwright for end-to-end testing.

## Tasks
- [ ] Install Playwright
- [ ] Configure playwright.config.ts
- [ ] Set up test fixtures
- [ ] Create page objects
- [ ] Add to CI pipeline

## Acceptance Criteria
- E2E tests runnable
- CI integration works
- Fixtures set up" \
"testing,e2e"

create_issue "[Test] Write E2E tests for authentication flow" \
"## Description
Test the complete login/logout flow.

## Tasks
- [ ] Test login redirect
- [ ] Test OAuth callback
- [ ] Test session persistence
- [ ] Test logout flow
- [ ] Test token refresh

## Acceptance Criteria
- Auth flow tested
- Edge cases covered
- Works in CI" \
"testing,e2e,auth"

create_issue "[Test] Write E2E tests for sync workflow" \
"## Description
Test the complete sync workflow end-to-end.

## Tasks
- [ ] Test CSV upload
- [ ] Test sync preview
- [ ] Test sync execution
- [ ] Test verification
- [ ] Test error recovery

## Acceptance Criteria
- Full workflow tested
- Error cases covered
- Works reliably" \
"testing,e2e,sync"

create_issue "[Test] Implement accessibility testing" \
"## Description
Ensure the app is accessible to all users.

## Tasks
- [ ] Add axe-core for testing
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Fix ARIA labels
- [ ] Test color contrast

## Acceptance Criteria
- No axe violations
- Keyboard works
- Screen reader works" \
"testing,a11y"

create_issue "[Test] Add performance testing" \
"## Description
Test and optimize application performance.

## Tasks
- [ ] Set up Lighthouse CI
- [ ] Test initial load time
- [ ] Test large data sets
- [ ] Profile React renders
- [ ] Identify bottlenecks

## Acceptance Criteria
- Lighthouse score > 90
- Large data handled
- No render issues" \
"testing,performance"

# ============================================================
# EPIC: Documentation
# ============================================================

create_issue "[Epic] Documentation" \
"## Overview
Create comprehensive documentation for the project.

## Goals
- User guide
- Admin guide
- API documentation
- Developer guide
- Troubleshooting guide" \
"epic,documentation"

create_issue "[Docs] Create user guide" \
"## Description
Write documentation for end users.

## Tasks
- [ ] Getting started guide
- [ ] Login instructions
- [ ] Viewing classes/students
- [ ] Running syncs
- [ ] Troubleshooting common issues

## Acceptance Criteria
- Clear instructions
- Screenshots included
- Troubleshooting helpful" \
"documentation,user"

create_issue "[Docs] Create admin setup guide" \
"## Description
Write documentation for administrators.

## Tasks
- [ ] Google Cloud setup guide
- [ ] Frontline configuration
- [ ] Environment setup
- [ ] Security best practices
- [ ] Maintenance procedures

## Acceptance Criteria
- Complete setup covered
- Security addressed
- Maintenance documented" \
"documentation,admin"

create_issue "[Docs] Create API documentation" \
"## Description
Document all API interactions and data models.

## Tasks
- [ ] Document Google Classroom API usage
- [ ] Document Frontline API usage
- [ ] Document data models
- [ ] Document sync operations
- [ ] Add code examples

## Acceptance Criteria
- APIs documented
- Models explained
- Examples provided" \
"documentation,api"

create_issue "[Docs] Create developer contributing guide" \
"## Description
Document how to contribute to the project.

## Tasks
- [ ] Development setup
- [ ] Code style guide
- [ ] PR process
- [ ] Testing requirements
- [ ] Release process

## Acceptance Criteria
- Setup documented
- Process clear
- Guidelines helpful" \
"documentation,developer"

create_issue "[Docs] Create architecture documentation" \
"## Description
Document the system architecture.

## Tasks
- [ ] System overview diagram
- [ ] Data flow diagrams
- [ ] Component architecture
- [ ] API integration diagram
- [ ] Deployment architecture

## Acceptance Criteria
- Diagrams clear
- Architecture explained
- Decisions documented" \
"documentation,architecture"

# ============================================================
# EPIC: Security & Compliance
# ============================================================

create_issue "[Epic] Security & Compliance" \
"## Overview
Ensure the application meets security and compliance requirements.

## Goals
- Secure authentication
- Data protection
- FERPA compliance
- Audit logging
- Vulnerability management" \
"epic,security"

create_issue "[Security] Implement secure token storage" \
"## Description
Store OAuth tokens securely.

## Tasks
- [ ] Use secure storage mechanism
- [ ] Encrypt tokens at rest
- [ ] Implement token rotation
- [ ] Handle token theft scenarios
- [ ] Add token revocation

## Acceptance Criteria
- Tokens stored securely
- Encryption implemented
- Rotation works" \
"security,auth"

create_issue "[Security] Implement audit logging" \
"## Description
Log all significant actions for audit trail.

## Tasks
- [ ] Log authentication events
- [ ] Log data access events
- [ ] Log sync operations
- [ ] Log configuration changes
- [ ] Secure log storage

## Acceptance Criteria
- All events logged
- Logs tamper-resistant
- Searchable logs" \
"security,audit"

create_issue "[Security] Add input validation and sanitization" \
"## Description
Validate and sanitize all user inputs.

## Tasks
- [ ] Validate CSV uploads
- [ ] Sanitize search inputs
- [ ] Validate API responses
- [ ] Prevent injection attacks
- [ ] Add Content Security Policy

## Acceptance Criteria
- All inputs validated
- XSS prevented
- CSP configured" \
"security,validation"

create_issue "[Security] Implement rate limiting" \
"## Description
Prevent abuse through rate limiting.

## Tasks
- [ ] Rate limit API calls
- [ ] Rate limit login attempts
- [ ] Show rate limit feedback
- [ ] Implement backoff
- [ ] Monitor for abuse

## Acceptance Criteria
- Limits enforced
- Feedback shown
- Abuse prevented" \
"security,api"

create_issue "[Security] Create security review checklist" \
"## Description
Document security review process.

## Tasks
- [ ] Create OWASP checklist
- [ ] Document threat model
- [ ] Review authentication
- [ ] Review data handling
- [ ] Review dependencies

## Acceptance Criteria
- Checklist complete
- Threats identified
- Mitigations documented" \
"security,documentation"

create_issue "[Security] Ensure FERPA compliance" \
"## Description
Ensure compliance with FERPA regulations.

## Tasks
- [ ] Review data handling practices
- [ ] Implement data minimization
- [ ] Add consent mechanisms
- [ ] Document data retention
- [ ] Create privacy policy

## Acceptance Criteria
- FERPA requirements met
- Privacy documented
- Consent handled" \
"security,compliance"

# ============================================================
# Print summary
# ============================================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Issue creation complete!${NC}"
echo -e "${GREEN}Total issues created: $ISSUE_COUNT${NC}"
echo -e "${GREEN}========================================${NC}"
