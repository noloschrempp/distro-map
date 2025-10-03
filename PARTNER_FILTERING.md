# Partner Filtering Feature

## Overview
Added partner filtering capability to the distribution map, allowing users to filter distributor locations by partner organization (e.g., Carrier, Trane, Mohawk).

---

## Business Context

**Problem:** Users often purchase exclusively through one partner across all their distributors. For example, a user working with Carrier may want to see all distributor locations that carry Carrier products, regardless of the distributor company.

**Solution:** Added a "Filter by Partner" option that displays all locations from any distributor associated with the selected partner(s).

---

## Implementation Details

### Data Structure Changes

#### Updated Type Definition
**File:** `src/models/types.ts`

Added `partner` field to the `Distributor` interface:
```typescript
export interface Distributor {
  // ... existing fields
  partner?: string; // Partner organization (e.g., "Carrier", "Trane", "Mohawk")
  // ... remaining fields
}
```

#### Updated Mock Data
**File:** `src/data/distributors.ts`

Added partner relationships to all mock distributors. Examples:
- Koch Air (2 locations) → Carrier partner
- Ferguson → Trane partner
- Home Depot → Mohawk partner
- Lowe's → Whirlpool partner
- Floor & Decor, Auer Steel & Heating → Armstrong partner
- Carpet One → Mohawk partner

This creates realistic scenarios where:
- Multiple distributors belong to the same partner (Carrier has 2 locations)
- Users can see 3 locations when filtering by Mohawk (Home Depot + Carpet One + manufacturers)

---

## Filter Logic

### How Filters Work Together

**Partner + Distributor Filters: AND Logic**

Both filters can be active simultaneously and work with AND logic:

1. **Partner Only:**
   - Select "Carrier" → Shows all Koch Air locations (Lexington + Louisville)
   - Select "Mohawk" → Shows Home Depot + Carpet One locations

2. **Distributor Only:**
   - Select "Koch Air" → Shows both Koch Air locations
   - Works as before

3. **Partner + Distributor (AND):**
   - Select "Carrier" + "Koch Air" → Shows Koch Air locations only (subset of Carrier)
   - Select "Mohawk" + "Home Depot" → Shows only Home Depot locations (subset of Mohawk)

4. **Multiple Partners:**
   - Select "Carrier" + "Trane" → Shows all Koch Air + Ferguson locations

5. **Combines with Category Filter:**
   - Partner "Carrier" + Category "HVAC" → Only Carrier HVAC locations
   - Partner "Mohawk" + Category "Carpet" → Only Mohawk carpet locations

### Search Also Works
Search query now includes partner names:
- Search "Carrier" → Finds Koch Air locations
- Search "Koch" → Finds Koch Air locations

---

## UI Components

### PartnerFilter Component
**File:** `src/components/PartnerFilter.tsx`

**Features:**
- Purple accent color (vs blue for distributor filter)
- Users icon to distinguish from distributor filter
- Same functionality as DistributorFilter (multi-select, search, counts)
- Dark mode styling consistent with app theme

**Visual Hierarchy:**
```
Search Bar
↓
Filter by Partner (purple accent)
↓
Filter by Distributor (blue accent)
↓
Clear Filters Button
```

### Filter Position
Positioned **above** the distributor filter to emphasize the hierarchy:
1. Users think in terms of partners first
2. Then narrow down by specific distributor if needed

---

## User Experience

### Use Cases

**Use Case 1: Partner-Exclusive Purchasing**
> "I only work with Carrier distributors. Show me all Carrier locations near me."

**Action:** Select Partner "Carrier" → Click "Find Near Me"
**Result:** Shows 2 Koch Air locations sorted by distance

**Use Case 2: Specific Distributor Under Partner**
> "I work with Carrier, but prefer Koch Air specifically."

**Action:** Select Partner "Carrier" + Distributor "Koch Air"
**Result:** Shows only Koch Air locations (already filtered by partner)

**Use Case 3: Multiple Partners**
> "I work with both Carrier and Trane partners."

**Action:** Select Partners "Carrier" + "Trane"
**Result:** Shows all Koch Air + Ferguson locations

**Use Case 4: Partner + Category**
> "Show me all Mohawk carpet distributors."

**Action:** Select Partner "Mohawk" + Category "Carpet"
**Result:** Shows Carpet One and any other Mohawk carpet locations

---

## Database Integration Notes

### When Moving to Production Database

1. **Add `partner` Column:**
```sql
ALTER TABLE distributors
ADD COLUMN partner TEXT;

CREATE INDEX idx_distributors_partner
ON distributors(partner)
WHERE partner IS NOT NULL;
```

2. **Partner Data Source:**
   - Partner information should come from event data
   - Map partner names consistently (e.g., "Carrier Corporation" → "Carrier")
   - Handle null partners gracefully (distributors without partners still show)

3. **API Query:**
```typescript
// When filtering by partners
const { data, error } = await supabase
  .from('distributors')
  .select('*')
  .eq('archived', false)
  .in('partner', selectedPartners);
```

4. **Category Mapping Rules:**
Consider adding partner to the mapping rules table for event transformation:
```sql
CREATE TABLE category_mapping_rules (
  -- ... existing fields
  partner TEXT, -- Map incoming partner names
  -- ... existing fields
);
```

---

## Performance Considerations

### Indexing
When handling 4,000+ distributors:
- Index the `partner` column for fast filtering
- Consider composite index on `(partner, program, archived)` for common queries

### Caching
- Partner list is computed from all distributors (memoized)
- No additional API calls required
- Counts update reactively as filters change

---

## Future Enhancements

### Potential Additions

1. **Partner Metadata:**
   - Add partner logos
   - Add partner descriptions
   - Link to partner websites

2. **Partner Groups:**
   - Group partners by industry (HVAC, Flooring, Paint)
   - Show partner hierarchy if applicable

3. **Exclusive Partnerships:**
   - Flag distributors with exclusive partner relationships
   - Show "Authorized" vs "Preferred" partner levels

4. **Analytics:**
   - Track which partners are most filtered
   - Show popular partners in the UI

5. **Bulk Selection:**
   - "Select all HVAC partners" button
   - Partner category groups

---

## Testing Checklist

- [x] Partner filter dropdown opens/closes
- [x] Can select multiple partners
- [x] Partner tags display correctly
- [x] Clear button removes partner filters
- [x] Partner + distributor filters work together (AND logic)
- [x] Partner + category filters work together
- [x] Partner included in search results
- [x] Build succeeds without errors
- [ ] Test with 100+ partners for performance
- [ ] Test with missing partner data (null values)
- [ ] Test on mobile devices

---

## Migration Path

### Phase 1: Current (Mock Data)
- Partner field added to types
- Mock data has realistic partner relationships
- UI fully functional

### Phase 2: Database Integration
- Add partner column to database
- Update event ingestion to include partner
- Map incoming partner names to canonical names

### Phase 3: Production
- Backfill existing distributors with partner data
- Monitor filter usage analytics
- Optimize queries based on usage patterns

---

## Questions & Answers

**Q: Can partner and distributor filters be active at the same time?**
A: Yes. They work with AND logic. Filtering by both shows only distributors that match BOTH conditions.

**Q: What if a distributor doesn't have a partner?**
A: Distributors without partners are ignored by the partner filter but still show in the unfiltered list and when using other filters.

**Q: Should we make filters mutually exclusive instead?**
A: No. AND logic is more powerful. Users can:
- Filter broadly by partner
- Then narrow by specific distributor if needed
- This matches how users think about their purchasing relationships

**Q: How do we handle partner name variations?**
A: Use canonical partner names in the database. Map variations during event ingestion (e.g., "Carrier Corporation" → "Carrier", "Trane Inc." → "Trane").

**Q: What about distributors with multiple partners?**
A: Current implementation uses a single partner field. If needed, we can change to an array:
```typescript
partner?: string[];  // Multiple partners
```

---

**Feature Status:** ✅ Complete and tested
**Ready for:** Database integration when event schema is available
