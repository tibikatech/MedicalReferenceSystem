# FHIR Export Enhancement Plan

## Overview
This document outlines the plan to enhance the FHIR export functionality in the MediRefs application, making it more user-friendly, informative, and similar to the CSV export feature with category/subcategory selection.

## Current Implementation
The current FHIR export tool provides:
- Basic category and subcategory selection
- Option for pretty-printing JSON
- Export to file functionality
- Simple preview capability

## Enhancement Goals
1. Create a more intuitive, step-by-step workflow
2. Provide educational content about FHIR and exported resources
3. Enhance the preview functionality with explanations
4. Add configuration options for different export formats
5. Improve the visual design and user experience

## UI/UX Design Plan

### 1. Workflow Structure
Implement a tabbed interface with three main steps:

**Step 1: Select Data**
- Clearly organized category and subcategory selection
- Real-time count indicators showing selected tests
- Search functionality for finding specific categories/subcategories
- Filter options to narrow down test selection

**Step 2: Preview & Configure**
- Interactive FHIR JSON preview with syntax highlighting
- Side-by-side explanations of FHIR structure
- Configuration options for export format and settings
- Option to see sample vs. full preview

**Step 3: Export & Complete**
- Export progress indicator
- Success confirmation with download link
- Option to create another export
- Educational content about using exported FHIR data

### 2. Visual Enhancements

**Selection Screen**
- Card-based layout for categories and subcategories
- Expand/collapse functionality for subcategories
- Clear visual indication of selection state
- Count badges showing available tests per category/subcategory

**Preview Screen**
- Syntax-highlighted JSON preview
- Annotated sections explaining FHIR components
- Split view with preview on one side, explanation on other
- Collapsible sections for detailed information

**Configuration Options**
- Radio buttons for FHIR Bundle vs. Individual Resources
- Toggle switches for formatting options
- Custom file naming input
- Advanced options in collapsible panel

### 3. Educational Content

**FHIR Basics Panel**
Add an informational panel explaining:
- What FHIR is and why it's important
- How FHIR enables healthcare interoperability
- The structure of FHIR resources
- How to use FHIR data in other systems

**Resource Mapping Explanation**
Include a table showing how MediRefs data maps to FHIR:

| MediRefs Field | FHIR Mapping | Description |
|----------------|--------------|-------------|
| Test ID | ServiceRequest.id | Unique identifier for the service request |
| Test Name | ServiceRequest.code.text | Human-readable name of the test |
| Category | ServiceRequest.category.text | Primary categorization of the test |
| Subcategory | ServiceRequest.subcategory.text | Secondary categorization |
| CPT Code | ServiceRequest.code.coding[system="http://www.ama-assn.org/go/cpt"] | CPT code for the procedure |
| LOINC Code | ServiceRequest.code.coding[system="http://loinc.org"] | LOINC code for laboratory tests |
| SNOMED Code | ServiceRequest.code.coding[system="http://snomed.info/sct"] | SNOMED CT code for clinical terms |
| Notes | ServiceRequest.note.text | Additional information about the test |

**FHIR Format Options**
Explain the different export format options:

1. **FHIR Bundle**
   - A collection of resources as a single unit
   - Contains a Bundle resource with entries for each test
   - Maintains relationships between resources
   - Better for interoperability with FHIR systems

2. **Individual Resources**
   - Array of ServiceRequest resources
   - Simpler structure without Bundle wrapper
   - Easier to process in non-FHIR systems
   - More suitable for custom integrations

### 4. Preview Improvements

**Enhanced JSON Preview**
- Add line numbers to JSON preview
- Use syntax highlighting for better readability
- Collapse/expand sections of the JSON
- Add tooltips explaining parts of the FHIR structure

**Sample Annotation**
```json
{
  "resourceType": "ServiceRequest",  // Type of FHIR resource
  "id": "TTES-LAB-CHE-83101",       // Test ID
  "status": "completed",            // Status of the request
  "intent": "original-order",       // Intent of the request
  "code": {                         // Coding information
    "coding": [                     // Multiple coding systems
      {
        "system": "http://www.ama-assn.org/go/cpt",  // CPT coding system
        "code": "83101",            // CPT code
        "display": "Test Name"      // Human-readable name
      }
    ],
    "text": "Test Name"             // Primary test name
  },
  "category": [                     // Categorization
    {
      "text": "Laboratory Tests"    // Main category
    }
  ]
}
```

### 5. Implementation of "What's Next" Section

Add a section explaining how to use the exported FHIR data:

1. **Integration with FHIR Servers**
   - How to upload to a FHIR server
   - Common FHIR server implementations
   - Authentication and security considerations

2. **Data Exchange**
   - How to share FHIR data with other systems
   - Standards for FHIR data exchange
   - SMART on FHIR integration

3. **Analytics and Reporting**
   - Using FHIR data for analytics
   - Tools that work with FHIR data
   - Examples of FHIR-based reporting

## Technical Implementation Notes

### Component Structure
The enhanced FHIR export functionality will be implemented by:

1. Updating the existing FhirExportTool component with:
   - Tabbed interface for workflow steps
   - Enhanced selection UI with filtering
   - Improved preview with explanations
   - Configuration options for export format

2. Adding educational content through:
   - Collapsible information panels
   - Tooltips for technical terms
   - Side-by-side explanations with preview
   - "What's Next" guidance section

### Dependencies
- Use shadcn's UI components for consistent design
- Implement syntax highlighting for JSON preview
- Add tooltips for educational content
- Use accordions for collapsible sections

## Conclusion
This enhancement plan provides a comprehensive approach to improving the FHIR export functionality in MediRefs. By implementing these changes, we'll create a more intuitive, educational, and powerful tool for users to export their medical test data in the FHIR format, supporting healthcare interoperability and data exchange.