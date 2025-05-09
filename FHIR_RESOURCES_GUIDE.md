# Understanding FHIR Resources and Extensions

This guide explains the FHIR resources used in the MediRefs export function and the extensions implemented to enhance interoperability.

## FHIR Overview

FHIR (Fast Healthcare Interoperability Resources) is a standard for electronic exchange of healthcare information. Developed by HL7, FHIR builds on previous standards while leveraging modern web technologies for easier implementation and more flexible interoperability.

### Key Characteristics of FHIR:

- **Resource-Based**: Information is organized into discrete, defined resources
- **RESTful API**: Uses modern web standards for data exchange
- **Human Readable**: Base resources are understandable by clinical users
- **Implementable**: Designed for real-world implementation, not just theory
- **Extensible**: Core resources can be extended for specific use cases
- **Free and Open**: Open standard without licensing restrictions

## ServiceRequest Resource

In the MediRefs FHIR export, medical tests are mapped to the **ServiceRequest** resource, which is designed to record the request for a procedure, diagnostic test, or other service to be performed.

### Core Elements Used in MediRefs Export

| Element | Description | Example |
|---------|-------------|---------|
| `resourceType` | Identifies this as a ServiceRequest | `"resourceType": "ServiceRequest"` |
| `id` | Unique identifier for this request | `"id": "TTES-LAB-CHE-83101"` |
| `status` | Current state of the request | `"status": "completed"` |
| `intent` | Reason for the request | `"intent": "original-order"` |
| `code` | What is being requested | Complex object with coding systems |
| `category` | Classification of service | `"category": [{"text": "Laboratory Tests"}]` |

### ServiceRequest.code Structure

The `code` element contains the most detailed information about the test, including standard coding systems:

```json
"code": {
  "coding": [
    {
      "system": "http://www.ama-assn.org/go/cpt",
      "code": "83101",
      "display": "Test Name"
    },
    {
      "system": "http://loinc.org",
      "code": "58410-2",
      "display": "Test Name"
    }
  ],
  "text": "Test Name"
}
```

### Why ServiceRequest?

The ServiceRequest resource was chosen because:

1. It's designed specifically for test orders and diagnostic requests
2. It supports multiple coding systems (CPT, LOINC, SNOMED CT)
3. It includes fields for categorization and notes
4. It's widely implemented in healthcare systems

## FHIR Extensions Used

FHIR allows for extensibility through Extensions when the base resources don't fully meet specific needs. In the MediRefs implementation, we've used the following extensions:

### 1. Subcategory Extension

While ServiceRequest includes a category element, it doesn't natively support subcategories. We've implemented an extension to include subcategory information:

```json
"subcategory": [
  {
    "text": "Hematology"
  }
]
```

This extension helps maintain the detailed categorization used in MediRefs.

### 2. Notes Extension

To preserve the rich notes and descriptions from MediRefs tests, we use the built-in note extension:

```json
"note": [
  {
    "text": "Detailed information about the test..."
  }
]
```

## FHIR Bundle Resource

When exporting multiple tests, we offer the option to wrap them in a FHIR Bundle resource. A Bundle is a container that groups multiple resources into a single package.

### Bundle Structure

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        // First ServiceRequest resource
      }
    },
    {
      "resource": {
        // Second ServiceRequest resource
      }
    }
    // Additional resources...
  ]
}
```

### Bundle Types

The MediRefs export uses the "collection" bundle type, but FHIR supports various bundle types:

| Bundle Type | Description | Use Case |
|-------------|-------------|----------|
| `document` | Immutable bundle with composition | Clinical document |
| `message` | Message for processing | System-to-system messaging |
| `transaction` | Bundle processed as a single unit | All-or-nothing operations |
| `collection` | Collection of resources | Simple grouping (used in MediRefs) |
| `history` | Historical versions of resources | Tracking changes over time |

## Coding Systems Used

The MediRefs FHIR export includes multiple coding systems to enhance interoperability:

### CPT (Current Procedural Terminology)
- **System URI**: `http://www.ama-assn.org/go/cpt`
- **Description**: Coding system for medical procedures and services
- **Use**: Primary coding system for all tests

### LOINC (Logical Observation Identifiers Names and Codes)
- **System URI**: `http://loinc.org`
- **Description**: Universal standard for identifying laboratory and clinical observations
- **Use**: Additional coding for laboratory tests

### SNOMED CT (Systematized Nomenclature of Medicine -- Clinical Terms)
- **System URI**: `http://snomed.info/sct`
- **Description**: Comprehensive clinical terminology
- **Use**: Additional coding for imaging studies and procedures

## Practical Applications

The FHIR-formatted data exported from MediRefs can be used in various ways:

### 1. Integration with EHR Systems
FHIR-enabled Electronic Health Record systems can import the exported ServiceRequest resources to create orders or document completed tests.

### 2. Health Information Exchange
The standardized format facilitates sharing test information between different healthcare organizations.

### 3. Clinical Decision Support
FHIR-based clinical decision support systems can use the structured data to provide recommendations based on available tests.

### 4. Research and Analytics
The standardized format makes it easier to aggregate and analyze test data across multiple sources.

## Best Practices for Using Exported FHIR Data

1. **Validate the FHIR Resources**: Use a FHIR validator to ensure compliance with the standard
2. **Preserve All Coding Systems**: Maintain all provided codes (CPT, LOINC, SNOMED) for maximum interoperability
3. **Use the Bundle Format** for System Integration: The Bundle format provides context and ensures all resources are processed together
4. **Consider Security and Privacy**: FHIR data may contain sensitive information; implement appropriate security measures

## Further FHIR Resources

- [FHIR Official Documentation](https://www.hl7.org/fhir/)
- [ServiceRequest Resource Documentation](https://www.hl7.org/fhir/servicerequest.html)
- [FHIR Bundle Resource](https://www.hl7.org/fhir/bundle.html)
- [SMART on FHIR](https://docs.smarthealthit.org/) - Framework for healthcare apps
- [FHIR Testing Servers](https://wiki.hl7.org/Publicly_Available_FHIR_Servers_for_testing)