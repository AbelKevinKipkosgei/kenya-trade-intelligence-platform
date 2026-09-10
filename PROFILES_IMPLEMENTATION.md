# User Profiles & Onboarding Implementation

## Overview
Successfully implemented role-specific user profiles and onboarding flows for the Kenya Trade Intelligence Platform. Users now have personalized experiences based on their role (exporter, officer, public) with complete profile management capabilities.

## ✅ Completed Features

### 1. Onboarding Flow (`/onboarding`)
- **Role Detection**: Automatically detects user role from session
- **Exporter Onboarding**: 
  - Business type selection (manufacturer, trader, cooperative, SME)
  - Primary sector selection from database
  - Business registration number (optional)
  - Multi-select counties of operation
  - Business description
- **Officer Onboarding**:
  - Agency/organization selection from database
  - Department/division input
  - Operational level (national, regional, county)
  - Role description
- **Skip Option**: Users can skip onboarding and complete later
- **Smart Redirect**: Completed profiles redirect to dashboard

### 2. User Profile Page (`/profile`)
- **Account Information**:
  - Full name, email, role badge
  - Member since date
  - Account status indicators
- **Role-Specific Profiles**:
  - **Exporters**: Business type, sector, registration number, counties, bio
  - **Officers**: Agency, department, operational level, role description
- **Edit Mode**: Inline editing with save/cancel
- **Complete Setup CTA**: For users without profiles

### 3. Profile Editing
- **Separate Edit View**: Clean form interface
- **Role-Specific Fields**: Different forms for exporters vs officers
- **Reference Data**: Dropdowns populated from database (sectors, agencies, counties)
- **Multi-Select**: Counties of operation with checkbox grid
- **Validation**: Required fields enforced
- **Auto-Save**: Updates profile and refreshes view

### 4. User Dashboard (`/dashboard`)
- **Personalized Welcome**: Greeting with user's first name
- **Profile Summary**: Quick view of sector/agency info
- **Role-Specific Quick Links**:
  - **Exporters**: Opportunities, Product Explorer, Barriers, AI Analyst
  - **Officers**: Dashboards, Exporters Directory, Barriers, Trade News
  - **Public**: Explorer, Dashboards, News
- **Getting Started Sidebar**: Helpful links for new users
- **Platform Overview**: Account status, profile completion, email verification
- **Incomplete Profile CTA**: Prompts to complete onboarding

### 5. API Endpoints

#### Profile Management
- `POST /api/user/profile` - Create or update full profile
- `GET /api/user/profile` - Fetch user's profile
- `PATCH /api/user/profile` - Partial profile update

#### Reference Data
- `GET /api/reference/sectors` - All sectors for dropdown
- `GET /api/reference/counties` - All Kenyan counties
- `GET /api/reference/agencies` - Government agencies
- `GET /api/reference/countries` - Countries for future use

### 6. Authentication Flow Updates
- **Post-Signup**: Auto-login and redirect to onboarding
- **Session Integration**: Profile data accessible throughout app
- **Protected Routes**: Dashboard and profile require authentication

## Database Schema

### `user_profiles` Table
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Exporter fields
  exporter_id INTEGER REFERENCES exporters(id),
  business_registration_number VARCHAR(100),
  business_type VARCHAR(50),
  primary_sector_id INTEGER REFERENCES sectors(id),
  counties_of_operation JSONB,
  
  -- Officer fields
  agency_id INTEGER REFERENCES agencies(id),
  department VARCHAR(200),
  officer_level VARCHAR(50),
  
  -- Common
  bio TEXT,
  avatar_url VARCHAR(500),
  notification_preferences JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX user_profiles_user_idx ON user_profiles(user_id);
CREATE INDEX user_profiles_exporter_idx ON user_profiles(exporter_id);
CREATE INDEX user_profiles_agency_idx ON user_profiles(agency_id);
```

## File Structure

```
app/
├── onboarding/
│   └── page.tsx                    # Onboarding router
├── profile/
│   └── page.tsx                    # Profile view page
├── dashboard/
│   └── page.tsx                    # User dashboard
├── auth/
│   └── signup/
│       └── page.tsx                # Updated with onboarding redirect
└── api/
    ├── user/
    │   └── profile/
    │       └── route.ts            # Profile CRUD endpoints
    └── reference/
        ├── sectors/route.ts        # Sectors reference data
        ├── counties/route.ts       # Counties reference data
        ├── agencies/route.ts       # Agencies reference data
        └── countries/route.ts      # Countries reference data

components/
├── onboarding/
│   ├── exporter-onboarding.tsx    # Exporter form
│   └── officer-onboarding.tsx     # Officer form
└── profile/
    ├── profile-view.tsx           # Profile display
    └── profile-edit-form.tsx      # Profile editing
```

## User Flows

### New Exporter Flow
```
1. Sign up with email/password, select "Exporter" role
2. Auto-login → Redirect to /onboarding
3. Fill out business details:
   - Business type: Manufacturer
   - Sector: Agriculture
   - Counties: Nairobi, Kiambu
   - Bio: "We export fresh produce..."
4. Click "Complete Setup"
5. Profile saved → Redirect to /dashboard
6. Dashboard shows:
   - Welcome message
   - Agriculture sector displayed
   - Quick links to Opportunities & Explorer
   - Getting Started guide
```

### New Officer Flow
```
1. Sign up with government email (@trade.go.ke), select "Officer" role
2. Auto-login → Redirect to /onboarding
3. Fill out officer details:
   - Agency: Ministry of Trade
   - Department: Export Promotion
   - Level: National
4. Click "Complete Setup"
5. Profile saved → Redirect to /dashboard
6. Dashboard shows:
   - Welcome message
   - Agency & department displayed
   - Quick links to Dashboards & Exporters
   - Platform stats
```

### Profile Edit Flow
```
1. User navigates to /profile or clicks "Profile Settings" in header
2. Sees current profile information
3. Clicks "Edit Profile" button
4. Form loads with current values
5. Updates fields (e.g., adds more counties, changes bio)
6. Clicks "Save Changes"
7. Profile updates → View refreshes with new data
8. Or clicks "Cancel" to discard changes
```

## Design Consistency

### Platform Design System Applied
- **Color Scheme**:
  - Kenya Green (#006651) for primary actions
  - Kenya Red (#CE1126) for required fields and errors
  - Kenya Black for headers and emphasis
- **Typography**: Barlow Condensed for headings, Source Sans 3 for body
- **Layout**: Tiered card design with border-top accents
- **Forms**: Consistent input styling with focus states
- **Buttons**: Clear primary/secondary hierarchy

## Key Features

### Smart Profile Detection
- Checks if profile exists before showing onboarding
- Validates profile completion based on role:
  - Exporter: Requires `primarySectorId`
  - Officer: Requires `agencyId`
  - Public: No requirements
- Redirects completed profiles to dashboard

### Multi-Select Counties
- Checkbox grid layout (2-3 columns)
- Scrollable container with max-height
- Visual feedback on selection
- Stores as JSONB array of county IDs

### Role-Specific Data Fetching
- Exporters see only sector-relevant data
- Officers see agency-specific information
- Efficient database queries with joins
- Proper TypeScript typing throughout

### Error Handling
- Client-side validation for required fields
- Server-side validation in API endpoints
- User-friendly error messages
- Loading states during async operations

## Performance Considerations

1. **Server Components**: Profile pages use RSC for initial data fetching
2. **Client Components**: Forms and interactive elements use "use client"
3. **Database Queries**: 
   - Single queries with joins for profile + relations
   - Indexed columns for fast lookups
4. **Reference Data**: Cached dropdowns, fetched once per session

## Security

1. **Authentication Required**: All profile routes protected by `requireAuth()`
2. **User Isolation**: Users can only access their own profiles
3. **Input Validation**: Both client and server-side
4. **SQL Injection Prevention**: Drizzle ORM parameterized queries
5. **XSS Protection**: React automatic escaping

## Future Enhancements (Not Yet Implemented)

### Phase 3: Watchlists (Next Phase)
- Create watchlist tables
- Track products/markets/opportunities
- Add "Track" buttons throughout platform
- Watchlist management page

### Phase 4: Notifications & Alerts
- User alerts table
- Background jobs for score changes
- In-app notification center
- Email notifications (optional)

### Phase 5: Advanced Features
- Profile completeness score
- Onboarding progress indicator
- Profile recommendations
- Export user data (GDPR compliance)
- Avatar upload
- Account deletion

## Testing Checklist

### Manual Testing Steps
```bash
# 1. Test Exporter Signup & Onboarding
- Sign up as exporter
- Verify auto-redirect to /onboarding
- Fill out form
- Submit and verify redirect to /dashboard
- Check profile at /profile

# 2. Test Officer Signup & Onboarding
- Sign up as officer with government email
- Complete onboarding flow
- Verify agency data appears correctly

# 3. Test Profile Editing
- Go to /profile
- Click "Edit Profile"
- Modify fields
- Save and verify updates
- Try cancel without saving

# 4. Test Dashboard
- Verify role-specific quick links
- Check profile summary accuracy
- Test "Complete Profile" CTA if incomplete

# 5. Test Skip Onboarding
- Create new account
- Click "Skip for now" on onboarding
- Verify redirect to dashboard
- Check incomplete profile state
```

## API Response Examples

### GET /api/user/profile
```json
{
  "profile": {
    "id": 1,
    "userId": 123,
    "businessType": "manufacturer",
    "primarySectorId": 5,
    "countiesOfOperation": [1, 2, 3],
    "bio": "We export fresh produce...",
    "createdAt": "2026-09-10T10:00:00Z",
    "updatedAt": "2026-09-10T10:00:00Z"
  }
}
```

### POST /api/user/profile
```json
{
  "profile": { /* updated profile */ },
  "success": true
}
```

### GET /api/reference/sectors
```json
{
  "sectors": [
    { "id": 1, "name": "Agriculture", "description": "..." },
    { "id": 2, "name": "Manufacturing", "description": "..." }
  ]
}
```

## Deployment Notes

1. **Database Migration**: Run `npm run db:push` or migration script
2. **Environment Variables**: Ensure `DATABASE_URL` and `AUTH_SECRET` are set
3. **Build Verification**: Run `npm run build` to check for TypeScript errors
4. **Seed Data**: Ensure sectors, agencies, and counties are seeded
5. **Reference Data**: Verify dropdown data loads correctly

---

**Implementation Date:** September 10, 2026  
**Status:** ✅ Complete  
**Total Implementation Time:** ~8 tasks completed  
**Files Created/Modified:** 13 files

## Next Steps

Based on the original authentication implementation plan, the recommended next phases are:

1. **Phase 3: Watchlists** - Allow users to track specific products/markets/opportunities
2. **Phase 4: Notifications & Alerts** - Real-time updates on tracked items
3. **Phase 5: Advanced Dashboard** - Analytics, charts, personalized recommendations

Would you like to proceed with implementing watchlists next?
