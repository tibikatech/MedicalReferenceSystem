# MediRefs - Medical Test Reference System

## Overview

MediRefs is a comprehensive medical test reference application built with modern web technologies. The system provides a centralized platform for managing, searching, and exporting medical test data with FHIR R4 compliance. The application serves healthcare professionals with a robust database of 121+ medical tests across 8 categories, supporting CSV and FHIR export formats.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Theme Support**: Dark/light mode with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Passport.js with local strategy and bcrypt hashing
- **File Processing**: Built-in CSV import/export with validation

### Database Architecture
- **Primary Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection**: Neon serverless PostgreSQL with WebSocket support

## Key Components

### Test Catalog System
The core of the application is a comprehensive test catalog with:
- **Test Entity**: Structured with ID, name, category, subcategory, and multiple coding systems
- **Category Classification**: 8 main categories (Laboratory Tests, Imaging Studies, etc.)
- **Subcategory Organization**: Detailed subcategorization for precise test classification
- **Medical Coding**: Support for CPT, LOINC, and SNOMED CT codes
- **Search & Filter**: Advanced search with category/subcategory filtering

### FHIR Export Engine
- **FHIR R4 Compliance**: ServiceRequest resource mapping for medical tests
- **Export Formats**: FHIR Bundle or individual resources
- **Code System Integration**: Automatic mapping to standard medical coding systems
- **Preview Functionality**: Interactive JSON preview with syntax highlighting
- **Configuration Options**: Pretty-printing and custom filename support

### CSV Import/Export System
- **Bulk Import**: CSV file processing with validation and duplicate detection
- **Field Mapping**: Intelligent mapping wizard for CSV headers to application fields
- **Progress Tracking**: Real-time upload progress with error reporting
- **Export Filtering**: Category and subcategory-based export filtering
- **Data Validation**: Comprehensive validation with user-friendly error messages

### Authentication System
- **User Management**: Multi-role support (Patient, Doctor, Facility, App Originator)
- **Session Security**: Secure session management with PostgreSQL persistence
- **Password Security**: Scrypt-based password hashing with salt
- **Route Protection**: Protected routes with authentication middleware

## Data Flow

### Test Data Management
1. Tests are stored in PostgreSQL with Drizzle ORM
2. Category and subcategory counts are dynamically calculated
3. Search operations use database-level filtering for performance
4. Real-time updates through TanStack Query invalidation

### Import Process
1. CSV file upload and parsing
2. Field mapping wizard for data alignment
3. Validation against application schema
4. Duplicate detection and resolution
5. Batch insertion with progress tracking

### Export Process
1. Category/subcategory selection interface
2. Data filtering and aggregation
3. Format selection (CSV or FHIR)
4. File generation and download

### Authentication Flow
1. Login credentials validation
2. Session creation with secure storage
3. Route-level authentication checks
4. Automatic session refresh and cleanup

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **express**: Web application framework
- **passport**: Authentication middleware

### UI and Styling
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **typescript**: Type safety and development experience
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: PostgreSQL with Drizzle migrations
- **Environment Variables**: DATABASE_URL and SESSION_SECRET configuration

### Production Build
- **Frontend**: Vite build with optimization and tree-shaking
- **Backend**: esbuild compilation to ESM format
- **Static Assets**: Served from Express with proper caching headers
- **Database**: Production PostgreSQL with connection pooling

### Replit Configuration
- **Modules**: Node.js 20, Web, PostgreSQL 16
- **Deployment**: Autoscale deployment target
- **Port Configuration**: Internal port 5000, external port 80
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

## Recent Changes
- **July 9, 2025**: Implemented FHIR R4-compliant dual resource export for imaging studies
  - **Enhanced FHIR Exporter**: Imaging studies now export as both ServiceRequest (order) and ImagingStudy (results) resources
  - Added DICOM modality mapping for imaging subcategories (X-ray→DX, MRI→MR, CT→CT, etc.)
  - Implemented intelligent body site extraction from test names using SNOMED CT codes
  - Created proper cross-references between ServiceRequest and ImagingStudy resources
  - **Enhanced Export UI**: Added dual resource export toggle with enhanced FHIR statistics
  - Real-time resource count display showing ServiceRequest, ImagingStudy, lab tests, and imaging studies breakdown
  - **Resource Type Planning**: Added comprehensive preview section showing exactly what FHIR resources will be generated
  - Detailed breakdown of laboratory tests vs imaging studies with resource type explanations
  - FHIR R4 compliance notices and resource generation transparency
  - Maintained backward compatibility with legacy ServiceRequest-only export mode
  - **FHIR Compliance**: Full FHIR R4 compliance for imaging workflows representing complete order-to-result lifecycle
- **July 7, 2025**: Completed Phases 1-3 of CPT Code Suffix Enhancement Roadmap
  - **Phase 1 - Data Analysis & Schema Enhancement**: Enhanced database schema with baseCptCode and cptSuffix fields
  - All 277 existing tests automatically parsed and populated with base codes and suffixes
  - Identified 216 unique CPT families with proper suffix grouping (e.g., 20610a-d, 84100a-b, 81001a-b)
  - Updated storage layer to auto-parse CPT codes on insert/update operations
  - Added API endpoints for CPT families analysis (/api/cpt-families)
  - **Phase 2 - Enhanced Export Options**: Completely redesigned CSV export with three format options:
    - Standard Format: Individual tests with separate base CPT code and suffix columns
    - Consolidated Format: Grouped by CPT families with all variations listed together
    - Legacy Format: Original format for backward compatibility
  - Added advanced export UI with format selection, export options toggles, and detailed statistics
  - Export preview shows total tests, unique CPT codes, tests with suffixes, and CPT families count
  - Dynamic filename generation based on export format and timestamp
  - **Phase 3 - Advanced Filtering & Grouping**: Implemented comprehensive CPT family management interface
    - Dual-view system: Standard View (traditional) and CPT Families View (advanced grouping)
    - CPT Family Filter component with intelligent search, suffix filtering, and family-size sorting
    - Expandable family accordion showing all test variations within each CPT family
    - Bulk Operations Panel with selection statistics and bulk actions (export, delete, copy IDs)
    - Real-time selection tracking across families and individual tests
    - CPT Family Tests Display with organized family grouping and individual test management
    - Advanced bulk deletion with detailed confirmation and progress tracking
    - Search functionality with CPT code prioritization and fuzzy matching
    - Category integration maintaining medical classification standards
- **July 7, 2025**: Enhanced search functionality with CPT code prioritization
  - Implemented intelligent ranking system for search results in DatabaseStorage.searchTests()
  - CPT code exact matches now appear first in search results
  - CPT codes starting with search term get second priority
  - Maintains comprehensive search across all fields while prioritizing medical codes
  - Tested and verified with CPT codes 85247, 85027, 85379 - all return exact matches first
- **July 6, 2025**: Implemented comprehensive data protection and source tracking system
  - Added dataSource column to tests table tracking data origin (JSON/CSV_IMPORT/MANUAL/API_IMPORT)
  - Implemented robust shielding mechanisms to prevent accidental CSV data overwrites
  - Server startup protection checks database state and blocks JSON imports when >50 CSV tests exist
  - Added data source statistics endpoint (/api/data-source-stats) for monitoring and auditing
  - Updated all import processes to properly track data sources with x-import-source headers
  - Created environment controls (ALLOW_JSON_IMPORT, FORCE_JSON_OVERRIDE) for production protection
  - All 92 existing tests properly marked as CSV_IMPORT preserving data integrity
- **July 6, 2025**: Implemented deletion progress modal with real-time tracking
  - Created DeletionProgressModal component matching upload progress UI/UX design
  - Added step-by-step progress tracking for both single and bulk test deletions
  - Displays current test being deleted by name, progress bar, and success/error counts
  - Shows detailed error messages for failed deletions with expandable error list
  - Updated both individual and bulk delete functions to use progress modal
  - Provides visual feedback similar to upload process for consistent user experience
- **June 20, 2025**: Fixed dynamic subcategory dropdown implementation
  - Replaced hardcoded VALID_SUBCATEGORIES with live API data from /api/test-count-by-subcategory
  - TestAddModal and TestEditModal now show all subcategories that exist in database
  - New subcategories like "Sputum", "Infectious Diseases", "Stool Panel" now appear automatically
  - Fixed test ID corruption issue in edit modal that was causing 404 errors on save
  - Added alphabetical sorting for better user experience
- **June 20, 2025**: Added `isReportable` flag to import sessions
  - Import sessions only appear in reports when tests are actually added to database
  - Maintains full audit trail while filtering meaningful reports
  - Updated ImportAuditService to mark sessions reportable only when successCount > 0

## Changelog
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.