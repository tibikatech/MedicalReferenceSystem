
# FHIR-Compliant Test Referral System Architecture

## Executive Summary

This document outlines the technical architecture for a comprehensive FHIR-compliant TypeScript Test Referral Application built on the MediRefs platform. The system enables seamless healthcare test ordering and referral management between patients, doctors, facilities, and application originators through standardized FHIR resource exchanges.

## System Overview

### Core Components
- **Test Catalog**: Comprehensive database of medical tests with FHIR ServiceRequest mappings
- **User Management**: Multi-profile system supporting patients, doctors, facilities, and app originators
- **FHIR Export Engine**: Standards-compliant data exchange mechanism
- **Referral Workflow**: Streamlined test ordering and result management

### Technology Stack
- **Frontend**: TypeScript + React + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Drizzle ORM
- **Standards**: FHIR R4, HL7 ServiceRequest resources
- **Deployment**: Replit platform

## FHIR-Compliant Test Catalog

### Current Implementation

#### Test Resource Structure
```typescript
interface Test {
  id: string;                    // Unique test identifier
  name: string;                  // Human-readable test name
  category: string;              // Primary categorization
  subCategory: string;           // Secondary categorization
  cptCode?: string;              // CPT procedure code
  loincCode?: string;            // LOINC observation code
  snomedCode?: string;           // SNOMED CT clinical term
  description?: string;          // Detailed test description
  notes?: string;                // Additional clinical notes
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### FHIR ServiceRequest Mapping
Each test is mapped to a FHIR ServiceRequest resource with the following structure:

```json
{
  "resourceType": "ServiceRequest",
  "id": "TTES-LAB-CHE-83101",
  "status": "active",
  "intent": "order",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/service-category",
      "code": "LAB",
      "display": "Laboratory Tests"
    }]
  }],
  "code": {
    "coding": [
      {
        "system": "http://www.ama-assn.org/go/cpt",
        "code": "83101",
        "display": "Comprehensive Metabolic Panel"
      },
      {
        "system": "http://loinc.org",
        "code": "59022-3",
        "display": "Comprehensive Metabolic Panel"
      }
    ],
    "text": "Comprehensive Metabolic Panel (CMP)"
  }
}
```

### Test Categories & Coverage

#### Laboratory Tests (95 tests)
- **Clinical Chemistry**: Basic/Comprehensive Metabolic Panels, Lipid Panels, Liver Function Tests
- **Hematology**: CBC, Platelet Count, ESR, Hemoglobin A1c
- **Immunology/Serology**: ANA, Rheumatoid Factor, TSH, HIV/Hepatitis testing
- **Microbiology**: Culture & Sensitivity, Blood/Urine/Stool/Sputum cultures
- **Molecular Diagnostics**: BRCA1/2, EGFR, KRAS mutations, NGS panels, HPV DNA

#### Imaging Studies (78 tests)
- **Computed Tomography (CT)**: Head, Chest, Abdomen, Spine imaging (contrast/non-contrast)
- **Magnetic Resonance Imaging (MRI)**: Brain, Spine, Joint, Organ-specific imaging

### Coding Standards Integration

#### CPT Codes (Current Procedural Terminology)
- **System URI**: `http://www.ama-assn.org/go/cpt`
- **Coverage**: 100% of tests include CPT codes
- **Usage**: Primary billing and procedural identification

#### LOINC Codes (Logical Observation Identifiers Names and Codes)
- **System URI**: `http://loinc.org`
- **Coverage**: 85% of laboratory tests
- **Usage**: Laboratory result standardization

#### SNOMED CT Codes (Systematized Nomenclature of Medicine)
- **System URI**: `http://snomed.info/sct`
- **Coverage**: 90% of imaging studies, 80% of laboratory tests
- **Usage**: Clinical terminology and semantic interoperability

## User Profile Architecture

### Patient Profile
```typescript
interface PatientProfile {
  id: string;
  fhirPatientId: string;         // FHIR Patient resource ID
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other' | 'unknown';
    mrn?: string;                // Medical Record Number
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: Address;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  preferences: {
    preferredLanguage: string;
    communicationMethods: string[];
    facilityPreferences: string[];
  };
  accessLevel: 'patient';
}
```

### Doctor Profile
```typescript
interface DoctorProfile {
  id: string;
  fhirPractitionerId: string;    // FHIR Practitioner resource ID
  professionalInfo: {
    firstName: string;
    lastName: string;
    title: string;
    specialties: string[];
    licenseNumber: string;
    npiNumber: string;           // National Provider Identifier
  };
  affiliations: {
    facilityId: string;
    role: string;
    department?: string;
  }[];
  orderingPrivileges: {
    testCategories: string[];
    restrictions?: string[];
  };
  contactInfo: {
    email: string;
    phone: string;
    officeFax?: string;
  };
  accessLevel: 'doctor';
}
```

### Facility Profile
```typescript
interface FacilityProfile {
  id: string;
  fhirOrganizationId: string;    // FHIR Organization resource ID
  facilityInfo: {
    name: string;
    type: 'hospital' | 'clinic' | 'laboratory' | 'imaging_center' | 'other';
    licenseNumber?: string;
    accreditation: string[];
  };
  serviceCapabilities: {
    testCategories: string[];
    testIds: string[];
    equipmentTypes: string[];
    operatingHours: {
      [day: string]: { open: string; close: string; };
    };
  };
  contactInfo: {
    address: Address;
    phone: string;
    email: string;
    website?: string;
  };
  networkInfo: {
    insuranceAccepted: string[];
    referralNetworks: string[];
  };
  accessLevel: 'facility';
}
```

### App Originator Profile
```typescript
interface AppOriginatorProfile {
  id: string;
  organizationInfo: {
    name: string;
    type: 'ehr_system' | 'telemedicine' | 'health_app' | 'research' | 'other';
    apiCredentials: {
      clientId: string;
      scopes: string[];
    };
  };
  integrationConfig: {
    fhirEndpoint?: string;
    webhookUrl?: string;
    dataFormats: ('fhir' | 'hl7' | 'csv')[];
  };
  permissions: {
    testCategories: string[];
    userTypes: ('patient' | 'doctor' | 'facility')[];
    operations: ('read' | 'write' | 'order' | 'results')[];
  };
  accessLevel: 'app_originator';
}
```

## FHIR Workflow Implementation

### Test Ordering Workflow

#### 1. ServiceRequest Creation
```typescript
interface TestOrderRequest {
  patientId: string;
  orderingPhysicianId: string;
  facilityId: string;
  testIds: string[];
  priority: 'routine' | 'urgent' | 'stat';
  clinicalInfo?: {
    diagnosis: string[];
    symptoms: string[];
    notes?: string;
  };
}

// Converts to FHIR ServiceRequest
function createFhirServiceRequest(order: TestOrderRequest): FhirServiceRequest {
  return {
    resourceType: "ServiceRequest",
    id: generateId(),
    status: "active",
    intent: "order",
    priority: order.priority,
    subject: {
      reference: `Patient/${order.patientId}`
    },
    requester: {
      reference: `Practitioner/${order.orderingPhysicianId}`
    },
    performerType: {
      reference: `Organization/${order.facilityId}`
    },
    code: {
      // Test-specific coding from catalog
    },
    reasonCode: order.clinicalInfo?.diagnosis.map(dx => ({
      text: dx
    }))
  };
}
```

#### 2. Resource Relationships
```typescript
interface FhirReferralBundle {
  patient: FhirPatient;
  practitioner: FhirPractitioner;
  organization: FhirOrganization;
  serviceRequests: FhirServiceRequest[];
  specimens?: FhirSpecimen[];
}
```

### Result Management Workflow

#### 1. DiagnosticReport Creation
```typescript
interface TestResult {
  serviceRequestId: string;
  status: 'preliminary' | 'final' | 'amended' | 'corrected';
  observations: FhirObservation[];
  conclusion?: string;
  performedBy: string;
  performedAt: Date;
}
```

#### 2. Observation Mapping
```typescript
function createObservation(result: LabResult): FhirObservation {
  return {
    resourceType: "Observation",
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "laboratory"
      }]
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: result.loincCode,
        display: result.testName
      }]
    },
    subject: {
      reference: `Patient/${result.patientId}`
    },
    valueQuantity: {
      value: result.numericValue,
      unit: result.unit,
      system: "http://unitsofmeasure.org"
    },
    referenceRange: [{
      low: { value: result.referenceRange.low },
      high: { value: result.referenceRange.high }
    }]
  };
}
```

## API Architecture

### Core Endpoints

#### Test Catalog Management
```typescript
// GET /api/tests - Retrieve test catalog
// GET /api/tests/:id - Get specific test
// GET /api/tests/categories - Get available categories
// GET /api/tests/fhir/:id - Get test as FHIR ServiceRequest
// POST /api/tests/fhir/export - Export multiple tests as FHIR Bundle
```

#### User Profile Management
```typescript
// GET /api/profiles/:userType/:id - Get user profile
// POST /api/profiles/:userType - Create user profile
// PUT /api/profiles/:userType/:id - Update user profile
// GET /api/profiles/doctor/:id/ordering-privileges - Get doctor's test permissions
// GET /api/profiles/facility/:id/capabilities - Get facility's test capabilities
```

#### Referral Management
```typescript
// POST /api/referrals - Create new test referral
// GET /api/referrals/:id - Get referral details
// GET /api/referrals/patient/:id - Get patient's referrals
// GET /api/referrals/doctor/:id - Get doctor's referrals
// PUT /api/referrals/:id/status - Update referral status
// GET /api/referrals/:id/fhir - Export referral as FHIR Bundle
```

### FHIR Compliance Endpoints

#### Resource Export
```typescript
// GET /api/fhir/Patient/:id - Export patient as FHIR resource
// GET /api/fhir/Practitioner/:id - Export doctor as FHIR resource
// GET /api/fhir/Organization/:id - Export facility as FHIR resource
// GET /api/fhir/ServiceRequest/:id - Export test order as FHIR resource
// GET /api/fhir/Bundle/referral/:id - Export complete referral bundle
```

## Database Schema Extensions

### User Management Tables
```sql
-- Users table (extends existing auth)
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  profile_type TEXT CHECK (profile_type IN ('patient', 'doctor', 'facility', 'app_originator')),
  profile_data JSON,
  fhir_resource_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test ordering and referrals
CREATE TABLE test_referrals (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES user_profiles(id),
  ordering_physician_id TEXT REFERENCES user_profiles(id),
  facility_id TEXT REFERENCES user_profiles(id),
  test_ids JSON, -- Array of test IDs
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'routine',
  clinical_info JSON,
  fhir_bundle_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test results
CREATE TABLE test_results (
  id TEXT PRIMARY KEY,
  referral_id TEXT REFERENCES test_referrals(id),
  test_id TEXT REFERENCES tests(id),
  result_data JSON,
  status TEXT DEFAULT 'pending',
  performed_by TEXT,
  performed_at DATETIME,
  fhir_diagnostic_report_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### FHIR Resource Tracking
```sql
CREATE TABLE fhir_resources (
  id TEXT PRIMARY KEY,
  resource_type TEXT,
  resource_id TEXT,
  local_entity_id TEXT,
  local_entity_type TEXT,
  fhir_data JSON,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security & Compliance

### HIPAA Compliance
- **Encryption**: All PHI encrypted at rest and in transit
- **Access Controls**: Role-based permissions for each user type
- **Audit Logging**: Complete audit trail for all data access
- **Data Minimization**: Only necessary data exposed per user role

### FHIR Security
- **OAuth 2.0**: SMART on FHIR authentication
- **Scopes**: Granular permissions (read, write, user, patient)
- **Resource Authorization**: Context-aware access controls

## Integration Patterns

### EHR System Integration
```typescript
interface EHRIntegration {
  authenticateWithEHR(credentials: EHRCredentials): Promise<AccessToken>;
  importPatientData(patientId: string): Promise<FhirPatient>;
  submitTestOrder(serviceRequest: FhirServiceRequest): Promise<OrderResponse>;
  retrieveResults(orderId: string): Promise<FhirDiagnosticReport>;
}
```

### Lab System Integration
```typescript
interface LabSystemIntegration {
  authenticateWithLab(credentials: LabCredentials): Promise<AccessToken>;
  submitSpecimen(specimen: FhirSpecimen): Promise<SpecimenResponse>;
  getTestCapabilities(): Promise<TestCapability[]>;
  retrieveResults(specimenId: string): Promise<FhirObservation[]>;
}
```

## Deployment Architecture

### Replit Production Setup
- **Environment**: Node.js production environment
- **Port Configuration**: 5000 (mapped to 80/443 in production)
- **Database**: SQLite with automatic backups
- **File Storage**: Local file system with Replit's persistent storage

### Scaling Considerations
- **Database**: Ready for migration to PostgreSQL when needed
- **Caching**: Redis integration for session management
- **Load Balancing**: Replit's built-in load balancing
- **CDN**: Static asset optimization

## Testing Strategy

### Unit Testing
- **Test Catalog**: FHIR mapping validation
- **User Profiles**: Profile creation and validation
- **API Endpoints**: Request/response validation

### Integration Testing
- **FHIR Compliance**: Resource validation against FHIR R4 specification
- **Workflow Testing**: End-to-end referral processes
- **External System Integration**: Mock EHR/Lab system interactions

### Compliance Testing
- **HIPAA**: Privacy and security validation
- **FHIR**: Resource structure and interaction validation
- **Interoperability**: Cross-system data exchange testing

## Future Enhancement Roadmap

### Phase 1: Core Implementation
- User profile management system
- Basic referral workflow
- FHIR export enhancement

### Phase 2: Advanced Features
- Real-time notifications
- Result delivery system
- Advanced analytics dashboard

### Phase 3: Enterprise Integration
- HL7 v2.x support
- Advanced EHR integrations
- Multi-tenant architecture

## Conclusion

This architecture provides a robust foundation for a FHIR-compliant test referral system that leverages the existing MediRefs test catalog while extending it to support comprehensive healthcare workflows. The modular design ensures scalability and maintainability while adhering to healthcare standards and regulations.

The system's strength lies in its comprehensive test catalog with standardized coding, flexible user profile system, and robust FHIR compliance, making it suitable for integration into existing healthcare ecosystems while providing a modern, intuitive user experience.
