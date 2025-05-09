# FHIR Export UI Wireframes

This document provides wireframe descriptions and visual mockups for the enhanced FHIR export interface.

## Step 1: Data Selection Screen

```
+------------------------------------------------------+
|                   FHIR Export Tool                   |
+------------------------------------------------------+
|                                                      |
|  [1] Select Data  >  [2] Preview  >  [3] Export      |
|                                                      |
+------------------------------------------------------+
|                                                      |
|  Test Selection                                      |
|  +-------------------------------------------------+ |
|  | Total Tests: 120     Selected Tests: 45  (38%)  | |
|  +-------------------------------------------------+ |
|                                                      |
|  +-------------------+    +----------------------+   |
|  | Categories        |    | Subcategories        |   |
|  | [Search...]       |    | [Search...]          |   |
|  |                   |    |                      |   |
|  | [ ] Select All    |    | [ ] Select All       |   |
|  |                   |    |                      |   |
|  | [x] Laboratory    |    | [x] Hematology (12)  |   |
|  |     Tests (65)    |    | [x] Chemistry (20)   |   |
|  |                   |    | [ ] Microbiology (8) |   |
|  | [ ] Imaging       |    | [ ] Serology (15)    |   |
|  |     Studies (35)  |    | [ ] Toxicology (5)   |   |
|  |                   |    | [ ] Urinalysis (5)   |   |
|  | [ ] Cardiovascular|    |                      |   |
|  |     Tests (10)    |    |                      |   |
|  |                   |    |                      |   |
|  | [ ] Neurological  |    |                      |   |
|  |     Tests (10)    |    |                      |   |
|  +-------------------+    +----------------------+   |
|                                                      |
|  Export Options                                      |
|  +-------------------------------------------------+ |
|  | FHIR Format:                                    | |
|  | (•) FHIR Bundle       ( ) Individual Resources  | |
|  |  [?]                       [?]                  | |
|  |                                                 | |
|  | [x] Pretty-print JSON (more readable output)    | |
|  |                                                 | |
|  | Filename: [medirefs-fhir-export-2022-05-09    ] | |
|  +-------------------------------------------------+ |
|                                                      |
|                           [Next: Preview FHIR Data >]|
+------------------------------------------------------+
```

**Key Features:**
- Progress indicator showing the current step (1 of 3)
- Summary showing total tests and selected tests
- Dual-panel selection for categories and subcategories
- Search functionality for both categories and subcategories
- Count indicators for each category and subcategory
- Basic export configuration options
- Clear "Next" button to proceed to preview

## Step 2: Preview Screen

```
+------------------------------------------------------+
|                   FHIR Export Tool                   |
+------------------------------------------------------+
|                                                      |
|  [1] Select Data  >  [2] Preview  >  [3] Export      |
|                                                      |
+------------------------------------------------------+
|                                                      |
|  FHIR Data Preview                                   |
|  +-------------------------------------------------+ |
|  | Format: FHIR Bundle        45 Tests Selected    | |
|  +-------------------------------------------------+ |
|                                                      |
|  +-----------------------+  +-----------------------+|
|  | FHIR Preview          |  | FHIR Resource Guide   ||
|  | (showing first 3)     |  |                       ||
|  |                       |  | [About ServiceRequest]||
|  | {                     |  | [Data Mapping      ▼] ||
|  |   "resourceType":     |  | +-----------------+   ||
|  |   "Bundle",           |  | | Test ID → id    |   ||
|  |   "type": "collection"|  | | Name → code.text|   ||
|  |   "entry": [          |  | | Category →      |   ||
|  |     {                 |  | | category.text   |   ||
|  |       "resource": {   |  | | CPT → coding    |   ||
|  |         "resourceType"|  | +-----------------+   ||
|  |         "ServiceReque |  |                       ||
|  |         "id": "TTES-  |  | [FHIR Format Types ▼] ||
|  |         "status": "co |  |                       ||
|  |         "intent": "or |  | [Usage Information ▼] ||
|  |         ...           |  |                       ||
|  |                       |  | The preview shows how ||
|  |                       |  | your selected tests   ||
|  |                       |  | will be exported to   ||
|  |                       |  | FHIR format using the ||
|  |                       |  | Bundle structure.     ||
|  |                       |  |                       ||
|  +-----------------------+  +-----------------------+|
|                                                      |
|  [< Back to Selection]           [Export FHIR Data >]|
+------------------------------------------------------+
```

**Key Features:**
- Two-column layout with preview and explanations
- Syntax-highlighted JSON preview
- Collapsible explanation sections
- Visual mapping between MediRefs and FHIR fields
- Navigation buttons to go back or proceed to export

## Step 3: Export Complete Screen

```
+------------------------------------------------------+
|                   FHIR Export Tool                   |
+------------------------------------------------------+
|                                                      |
|  [1] Select Data  >  [2] Preview  >  [3] Export      |
|                                                      |
+------------------------------------------------------+
|                                                      |
|                    ✓                                 |
|               Export Complete!                       |
|                                                      |
|  Your FHIR data has been successfully exported       |
|  as medirefs-fhir-export-2022-05-09.json            |
|                                                      |
|  +------------------------------------------------+  |
|  |  medirefs-fhir-export-2022-05-09.json    [45]  |  |
|  +------------------------------------------------+  |
|                                                      |
|  [Create Another Export]      [Close]                |
|                                                      |
|  What's Next?                                        |
|  +------------------+  +------------------+  +------+|
|  |     Import to    |  |       Data       |  |      ||
|  |    FHIR Server   |  |    Integration   |  |Report||
|  |                  |  |                  |  |      ||
|  | Use your exported|  | Integrate with   |  |Use   ||
|  | data with any    |  | healthcare       |  |stand ||
|  | FHIR-compliant   |  | systems or       |  |FHIR  ||
|  | server or EHR    |  | analytics        |  |for   ||
|  +------------------+  +------------------+  +------+|
|                                                      |
+------------------------------------------------------+
```

**Key Features:**
- Clear success message with checkmark icon
- Display of the exported filename
- Options to create another export or close
- "What's Next" section with guidance on using the exported data
- Simple, focused layout for completion step

## Visual Design Elements

### Selection UI Elements
- Checkboxes for categories and subcategories
- Search box with magnifying glass icon
- Count badges showing number of tests per category/subcategory
- Toggle switches for binary options
- Radio buttons for format selection
- Text input for filename

### Preview UI Elements
- Syntax-highlighted code box with line numbers
- Collapsible accordions for information sections
- Information icons with tooltips
- Split pane with draggable divider

### Export Complete UI Elements
- Large checkmark icon for success confirmation
- File information box with count badge
- Card-based layout for "What's Next" options
- Icon-based guidance cards

## Color Scheme
- Primary action buttons: Blue (#3B82F6)
- Secondary/cancel buttons: Gray (#6B7280)
- Success indicators: Green (#10B981)
- Information elements: Light blue (#93C5FD)
- JSON syntax highlighting: Green (#10B981) for strings, Blue (#3B82F6) for keys
- Dark mode variants with appropriate contrast

## Responsive Design
- On smaller screens, the two-column layouts will stack vertically
- Scrollable areas for selections and previews on mobile
- Touch-friendly spacing for mobile interactions
- Accordion-style UI for mobile to conserve space

## Interactive Elements
- Tooltips appearing on hover/tap for information icons
- Expandable/collapsible sections for detailed information
- Real-time updates to selection counts
- Progress indicator that highlights the current step