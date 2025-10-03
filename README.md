# Distributor Map Project

This project provides a distributor location map with category filtering, search, and listing functionality.

## Features

- Interactive map showing distributor locations
- Category filtering (HVAC, Appliances, Flooring, Paint, Carpet)
- Search functionality for distributors and locations
- Detailed distributor information with expandable details
- Responsive design for desktop and mobile

## Tech Stack

- React with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Leaflet for interactive maps
- Supabase for database and API
- Lucide React for icons

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your Supabase credentials
4. Start the development server: `npm run dev`

## Database Setup

The project requires a Supabase database with the following table:

- `distributors`: Stores information about distributor locations

Migration files are provided in the `supabase/migrations` directory.

### Data Structure

The distributors table has the following structure:

```
id                              - Unique identifier for the distributor location
distributor                     - Distributor company name
name                            - Location/branch name
program                         - Category (HVAC, Appliances, Flooring, etc.)
archived                        - Whether the distributor is archived
address_city                    - City
address_line_1                  - Street address
address_line_2                  - Additional address info
address_state                   - State
postal_code                     - ZIP/Postal code
country                         - Country code
location_lat                    - Latitude
location_lon                    - Longitude
store_number                    - Store identifier
contact_name                    - Contact person name
contact_emails                  - Contact email addresses
contact_phone                   - Contact phone number
contact_fax                     - Contact fax number
fulfill_delivery                - Whether location offers delivery
fulfill_pickup                  - Whether location offers pickup
distribution_image_icon         - URL to distributor logo
distribution_center_manufacturers - List of manufacturers
row_num                         - Row number
county_fips                     - County FIPS code
cbsa_title                      - Core Based Statistical Area title
```

## Project Structure

- `/src/components`: React components
- `/src/models`: TypeScript interfaces and types
- `/src/lib`: Utility functions and API clients
- `/src/api`: API functions for data fetching
- `/public`: Static assets

## Deployment

Build the project for production:

```
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to your hosting provider.