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

## Changelog
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.