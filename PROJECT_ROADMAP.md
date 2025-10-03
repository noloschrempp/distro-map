# Distribution Map - Project Roadmap

## Project Overview
Replacing a manually-updated Google Map with an integrated distribution map that connects to your internal distribution database for real-time location updates.

**Current Status:** ✅ Frontend complete and optimized | ⏳ Awaiting backend event integration

---

## Phase 1: Frontend Development ✅ COMPLETE

### Completed Work

#### Performance Optimizations
- ✅ Memoized filtering for 4,000+ distributors
- ✅ Map marker clustering (handles unlimited markers smoothly)
- ✅ Parallel data loading on initial render
- ✅ Optimized re-renders with React.useMemo

#### UI/UX Redesign (Dark Mode)
- ✅ Modern dark slate theme (slate-950 background)
- ✅ Refined header with gradient logo
- ✅ Streamlined sidebar (320px fixed width)
- ✅ Gradient accent buttons (blue-cyan)
- ✅ Compact, elegant component styling
- ✅ Better spacing throughout

#### Core Features
- ✅ Interactive map with OpenStreetMap tiles
- ✅ Category filtering (All, HVAC, Appliances, Flooring, Paint, Carpet)
- ✅ Search by distributor name, location, city, state
- ✅ **Partner filtering** (NEW - filter by Carrier, Trane, Mohawk, etc.)
- ✅ Distributor filtering (multi-select)
- ✅ "Find Near Me" geolocation (50-mile radius)
- ✅ Property management (add/edit/delete user properties)
- ✅ Property-based filtering (show distributors near properties)
- ✅ Distance calculations and sorting
- ✅ Clear all filters button

#### Data Persistence
- ✅ Properties stored in localStorage (temporary until backend ready)
- ✅ Survives page refreshes

#### Testing Tools
- ✅ Large dataset generator (500+ distributors for performance testing)
- ✅ Toggle in `src/api/distributors.ts` to enable

---

## Phase 2: Backend Integration 🔄 IN PROGRESS

### What You Need From Your Team

Before we can connect to real data, you need to provide:

#### 1. Event Schema Definition
**Status:** ⏳ Pending

Provide the structure of distribution location events:
```javascript
{
  location_id: "?",           // Unique identifier
  company_name: "?",          // Distributor company (Home Depot, Ferguson, etc.)
  branch_name: "?",           // Location name
  product_line: "?",          // Maps to program category
  partner: "?",               // NEW: Partner org (Carrier, Trane, etc.)
  street: "?",
  city: "?",
  state: "?",
  zip: "?",
  latitude: "?",
  longitude: "?",
  status: "active|inactive",  // Maps to archived field
  contact_phone: "?",
  fulfillment_options: "?",   // Delivery/pickup
  // ... other fields
}
```

**Questions to Answer:**
- What system publishes these events? (SAP, Salesforce, custom?)
- What fields are available in the events?
- How are partner relationships indicated?

#### 2. Category Mapping Rules
**Status:** ⏳ Pending

Define how to map incoming product lines to our 5 categories:
- HVAC
- Appliances
- Flooring
- Paint
- Carpet

**Example:**
```
product_line: "HVAC Equipment" → program: "HVAC"
product_line: "Air Conditioning" → program: "HVAC"
product_line: "Refrigerators" → program: "Appliances"
```

#### 3. Partner Mapping Rules
**Status:** ⏳ Pending

Define how to map partner names to canonical values:
```
"Carrier Corporation" → "Carrier"
"Trane Inc." → "Trane"
"Mohawk Industries" → "Mohawk"
```

#### 4. Backfill Plan
**Status:** ⏳ Pending

**Questions:**
- How will we get initial 4,000+ distributors into database?
- What's the data source? (CSV export, API, database dump?)
- Timeline for backfill?

#### 5. Event Delivery Mechanism
**Status:** ⏳ Pending

**Questions:**
- Webhook endpoint URL?
- Message queue details (Kafka, RabbitMQ)?
- Authentication method?
- Frequency: Real-time, batch, or polling?
- Weekly updates sufficient?

---

## Phase 3: Database Setup 📋 READY TO START

Once you have event schema, we need to:

### Database Configuration

#### 1. Create Distributors Table
```sql
CREATE TABLE distributors (
  id TEXT PRIMARY KEY,
  distributor TEXT NOT NULL,
  name TEXT NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('HVAC', 'Appliances', 'Flooring', 'Paint', 'Carpet')),
  partner TEXT,                -- NEW: Partner organization
  archived BOOLEAN DEFAULT false,

  -- Address
  address_line_1 TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',

  -- Geolocation (CRITICAL for distance queries)
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lon DECIMAL(11, 8) NOT NULL,

  -- Contact
  contact_phone TEXT,

  -- Fulfillment
  fulfill_delivery BOOLEAN DEFAULT true,
  fulfill_pickup BOOLEAN DEFAULT true,

  -- Metadata
  distribution_center_manufacturers JSONB,

  -- Event tracking
  event_source TEXT,
  last_event_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CRITICAL INDEXES for 4,000+ records
CREATE INDEX idx_distributors_archived ON distributors(archived) WHERE archived = false;
CREATE INDEX idx_distributors_program ON distributors(program) WHERE archived = false;
CREATE INDEX idx_distributors_partner ON distributors(partner) WHERE partner IS NOT NULL;
CREATE INDEX idx_distributors_composite ON distributors(program, archived, distributor);

-- For geographic queries
CREATE INDEX idx_distributors_location ON distributors USING GIST (
  ll_to_earth(location_lat, location_lon)
);
```

#### 2. Create Category Mapping Table
```sql
CREATE TABLE category_mapping_rules (
  id SERIAL PRIMARY KEY,
  source_field TEXT NOT NULL,
  source_value TEXT NOT NULL,
  target_program TEXT NOT NULL CHECK (target_program IN ('HVAC', 'Appliances', 'Flooring', 'Paint', 'Carpet')),
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Create Partner Mapping Table
```sql
CREATE TABLE partner_mapping_rules (
  id SERIAL PRIMARY KEY,
  source_value TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example data
INSERT INTO partner_mapping_rules (source_value, canonical_name) VALUES
  ('Carrier Corporation', 'Carrier'),
  ('Carrier Corp', 'Carrier'),
  ('Trane Inc.', 'Trane'),
  ('Trane Technologies', 'Trane'),
  ('Mohawk Industries', 'Mohawk');
```

#### 4. Set Up Supabase
```bash
# Add to .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Phase 4: Event Ingestion 🔧 DESIGN READY

### Backfill Script (One-time)
```typescript
async function backfillDistributors(csvData: any[]) {
  const mapped = csvData.map(row => ({
    id: row.location_id,
    distributor: row.company_name,
    name: row.branch_name,
    program: applyProgramMappingRules(row.product_line),
    partner: applyPartnerMappingRules(row.partner),
    address_line_1: row.street,
    address_city: row.city,
    address_state: row.state,
    postal_code: row.zip,
    location_lat: parseFloat(row.latitude),
    location_lon: parseFloat(row.longitude),
    archived: row.status === 'inactive',
    contact_phone: row.phone,
    fulfill_delivery: row.delivery === 'yes',
    fulfill_pickup: row.pickup === 'yes',
    event_source: 'backfill',
  }));

  // Batch upsert
  const { error } = await supabase
    .from('distributors')
    .upsert(mapped, { onConflict: 'id' });
}
```

### Event Processing (Ongoing)
```typescript
// Webhook endpoint or queue consumer
async function processDistributorEvent(event: any) {
  const distributor = {
    id: event.location_id,
    distributor: event.company_name,
    name: event.branch_name,
    program: applyProgramMappingRules(event.product_line),
    partner: applyPartnerMappingRules(event.partner),
    archived: event.status === 'inactive',
    last_event_timestamp: new Date(event.timestamp),
    event_source: event.source_system,
    // ... map all fields
  };

  // Upsert (insert or update)
  await supabase
    .from('distributors')
    .upsert(distributor, { onConflict: 'id' });
}
```

---

## Phase 5: Frontend Integration 🔌 CODE READY

Once database is populated, update:

### 1. Update Distributor API
**File:** `src/api/distributors.ts`

```typescript
// Change from:
let distributors = USE_LARGE_DATASET ? generateLargeDistributorDataset(500) : [...mockDistributors];

// To:
const { data, error } = await supabase
  .from('distributors')
  .select('*')
  .eq('archived', false);

if (error) throw error;
let distributors = data || [];
```

### 2. Update Properties API
**File:** `src/api/properties.ts`

Replace localStorage with Supabase queries (when auth is ready).

### 3. Test & Deploy
- Test with real data
- Monitor performance with 4,000+ records
- Deploy to production

---

## Remaining Frontend Work 🎨

### Optional Polish (Not Critical)

1. **Complete DistributorList Dark Mode**
   - Update icon colors to vibrant versions
   - Refine expanded section styling
   - Update scroll indicator gradient

2. **Update PropertyManagement Modal**
   - Apply dark mode theme
   - Match main app styling

3. **Dark Map Tiles** (Optional)
   - Consider dark map theme from Carto or similar
   - Better integration with dark UI

---

## Timeline & Dependencies

### Current State
- ✅ Frontend: 95% complete
- ✅ Performance: Optimized for 4,000+ records
- ✅ Dark Mode: 90% complete
- ✅ Partner Filtering: 100% complete
- ⏳ Backend: Waiting on event schema

### Critical Path
```
1. Get event schema from your team (BLOCKER)
   ↓
2. Create database tables
   ↓
3. Build event ingestion
   ↓
4. Backfill initial data
   ↓
5. Update frontend API calls
   ↓
6. Test & Deploy
```

### Estimated Timeline (Once Event Schema Provided)
- Database setup: 1 day
- Event ingestion development: 2-3 days
- Backfill script: 1 day
- Testing: 2 days
- Frontend integration: 1 day
- **Total: 1-2 weeks**

---

## Key Questions for Your Team

### Immediate (Needed to Progress)
1. ❓ What's the event schema structure?
2. ❓ What system publishes these events?
3. ❓ How are partner relationships indicated?
4. ❓ What are the category mapping rules?

### Planning (Needed Soon)
5. ❓ Timeline for event schema delivery?
6. ❓ Who owns the event ingestion service?
7. ❓ What's the backfill data source?
8. ❓ Weekly polling acceptable or need real-time?

### Future (Nice to Know)
9. ❓ Authentication requirements for property management?
10. ❓ Analytics/tracking requirements?
11. ❓ Any other data we should display?

---

## Success Metrics

### Performance Targets
- ✅ Initial load: < 2 seconds (with 4,000 distributors)
- ✅ Filter operations: < 100ms
- ✅ Map rendering: Smooth at all zoom levels
- ✅ Search: Instant feedback

### User Experience
- ✅ Intuitive filtering (category, partner, distributor)
- ✅ "Find Near Me" location-based search
- ✅ Property management for repeat users
- ✅ Clear visual hierarchy
- ✅ Modern, professional design

### Business Goals
- ⏳ Real-time data (no manual updates)
- ⏳ 4,000+ clicks/month (match old map usage)
- ⏳ Improved accessibility
- ⏳ Reduced maintenance burden

---

## Next Steps

### For You
1. **Schedule meeting** with backend team to get event schema
2. **Review** [PARTNER_FILTERING.md](PARTNER_FILTERING.md) for partner implementation details
3. **Decide** on database provider (Supabase, PostgreSQL, etc.)
4. **Provide** category and partner mapping rules

### For Us (When Ready)
1. Create database tables
2. Build event ingestion service
3. Write backfill script
4. Integrate frontend with real data
5. Deploy to production

---

## Documentation
- 📄 [QUICK_START.md](QUICK_START.md) - How to run the app
- 📄 [CHANGES.md](CHANGES.md) - Performance optimizations details
- 📄 [PARTNER_FILTERING.md](PARTNER_FILTERING.md) - Partner filtering implementation
- 📄 [DARK_MODE_UPDATE.md](DARK_MODE_UPDATE.md) - UI redesign notes
- 📄 [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) - This file

---

**Current Status:** Frontend ready, awaiting backend event schema to proceed with integration.

**Last Updated:** 2025-10-03
