import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Book, 
  FileCode, 
  Youtube, 
  Wrench, 
  Users, 
  Building, 
  Activity, 
  FileText, 
  User, 
  UserCog,
  ChevronLeft
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FhirResourcesWikiPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Header onSearch={setSearchQuery} />
      
      <main className="flex-grow bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button and title */}
          <div className="flex items-center mb-6">
            <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center mr-4">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white">FHIR Resources &amp; Wiki</h1>
          </div>
          
          {/* Hero section with FHIR introduction */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-3">Fast Healthcare Interoperability Resources (FHIR)</h2>
            <p className="text-lg mb-4">
              FHIR is a standard for healthcare data exchange, developed by HL7 International.
              It enables seamless integration between healthcare systems, improving interoperability
              and patient care across the healthcare ecosystem.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-800 bg-opacity-50 p-4 rounded-lg flex items-center">
                <FileCode className="w-8 h-8 mr-3 text-blue-300" />
                <div>
                  <h3 className="font-medium">Modern API Approach</h3>
                  <p className="text-sm text-blue-200">RESTful, JSON, XML and RDF formats</p>
                </div>
              </div>
              <div className="bg-blue-800 bg-opacity-50 p-4 rounded-lg flex items-center">
                <Activity className="w-8 h-8 mr-3 text-blue-300" />
                <div>
                  <h3 className="font-medium">Active Development</h3>
                  <p className="text-sm text-blue-200">Evolving standard with strong adoption</p>
                </div>
              </div>
              <div className="bg-blue-800 bg-opacity-50 p-4 rounded-lg flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-300" />
                <div>
                  <h3 className="font-medium">Healthcare Focus</h3>
                  <p className="text-sm text-blue-200">Designed for clinical and administrative needs</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content with tabs */}
          <Tabs defaultValue="learn" className="mb-8">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="learn" className="flex items-center">
                <Book className="w-4 h-4 mr-2" />
                Learn FHIR
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Resources Guide
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center">
                <Wrench className="w-4 h-4 mr-2" />
                FHIR Tools
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center">
                <Youtube className="w-4 h-4 mr-2" />
                Video Resources
              </TabsTrigger>
            </TabsList>
            
            {/* Learn FHIR Tab */}
            <TabsContent value="learn" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Introduction to FHIR</CardTitle>
                  <CardDescription>Understanding the fundamentals of FHIR</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-invert max-w-none">
                    <h3>What is FHIR?</h3>
                    <p>
                      FHIR (Fast Healthcare Interoperability Resources) is a standard for exchanging healthcare information electronically.
                      Developed by HL7, FHIR combines the best features of previous standards while leveraging current web technologies.
                    </p>
                    
                    <h3>Core Principles</h3>
                    <ul>
                      <li><strong>Resources:</strong> FHIR is built around modular components called "Resources" which represent clinical concepts.</li>
                      <li><strong>REST API:</strong> FHIR implements a RESTful architecture making it accessible through common web technologies.</li>
                      <li><strong>Human Readability:</strong> All resources can include a text representation for human consumption.</li>
                      <li><strong>Extensions:</strong> The FHIR specification is flexible and can be extended to meet specific needs.</li>
                    </ul>
                    
                    <h3>Why FHIR Matters</h3>
                    <p>
                      FHIR addresses many of the challenges in healthcare data exchange:
                    </p>
                    <ul>
                      <li>Simplifies integration between healthcare systems</li>
                      <li>Enables mobile health applications and patient engagement</li>
                      <li>Supports clinical decision support and precision medicine</li>
                      <li>Facilitates research and population health management</li>
                      <li>Reduces costs and improves efficiency in healthcare IT</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4 mt-6">
                    <h4 className="font-medium mb-2">FHIR at a Glance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <div className="mr-2 p-2 rounded-full bg-blue-900">
                          <FileText className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <h5 className="font-medium">Resources</h5>
                          <p className="text-sm text-gray-300">The building blocks of FHIR, representing clinical concepts</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="mr-2 p-2 rounded-full bg-blue-900">
                          <FileCode className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <h5 className="font-medium">RESTful API</h5>
                          <p className="text-sm text-gray-300">Simple web-based access to resources</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="mr-2 p-2 rounded-full bg-blue-900">
                          <Users className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <h5 className="font-medium">Implementation Guides</h5>
                          <p className="text-sm text-gray-300">Domain-specific rules for FHIR implementations</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="mr-2 p-2 rounded-full bg-blue-900">
                          <Activity className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <h5 className="font-medium">Operations</h5>
                          <p className="text-sm text-gray-300">Standardized procedures on resources</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Getting Started with FHIR</CardTitle>
                  <CardDescription>Your first steps with FHIR implementation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <h3>Key Concepts</h3>
                    <p>
                      Before diving into FHIR implementation, it's important to understand these fundamental concepts:
                    </p>
                    
                    <h4>Resources</h4>
                    <p>
                      Resources are the core building blocks in FHIR. Each resource represents a concept in healthcare 
                      such as a patient, procedure, medication, or organization. Resources have a defined structure,
                      a set of common metadata, and a human-readable section.
                    </p>
                    
                    <h4>References</h4>
                    <p>
                      Resources can reference other resources, creating relationships between them. For example, 
                      an Observation resource might reference a Patient resource to indicate which patient the 
                      observation is about.
                    </p>
                    
                    <h4>Profiles</h4>
                    <p>
                      Profiles specify constraints on resources to adapt them for specific use cases. They can 
                      restrict the cardinality of elements, constrain allowed values, and add extensions.
                    </p>
                    
                    <h4>Extensions</h4>
                    <p>
                      Extensions allow adding new elements to resources without changing the core specification. 
                      They are a key mechanism for flexibility in FHIR.
                    </p>
                    
                    <h3>Implementation Approaches</h3>
                    <p>
                      There are several ways to implement FHIR, depending on your needs:
                    </p>
                    <ul>
                      <li><strong>REST API:</strong> The most common approach, using HTTP verbs (GET, POST, PUT, DELETE) to interact with resources</li>
                      <li><strong>Messaging:</strong> When systems need to notify others about events</li>
                      <li><strong>Documents:</strong> For persistent, human-readable content that needs to be authenticated</li>
                      <li><strong>Services:</strong> For more complex interactions that don't fit the REST paradigm</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4 mt-6">
                    <h4 className="font-medium mb-2">Getting Help with FHIR</h4>
                    <p className="mb-4">The FHIR community offers extensive resources to help you get started:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-purple-800 flex items-center justify-center mr-2">
                          <span className="text-xs">1</span>
                        </div>
                        <span><a href="https://hl7.org/fhir/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Official FHIR Documentation</a> - Comprehensive technical reference</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-purple-800 flex items-center justify-center mr-2">
                          <span className="text-xs">2</span>
                        </div>
                        <span><a href="https://chat.fhir.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">FHIR Chat</a> - Community discussion forum</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-purple-800 flex items-center justify-center mr-2">
                          <span className="text-xs">3</span>
                        </div>
                        <span><a href="https://registry.fhir.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">FHIR Registry</a> - Implementation guides and packages</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Resources Guide Tab */}
            <TabsContent value="resources" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>FHIR Resources Reference</CardTitle>
                  <CardDescription>Detailed explanations of common FHIR resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-6">
                    FHIR resources are the building blocks of healthcare information exchange. Each resource
                    represents a specific healthcare concept and has a defined structure. Here are the key
                    resources relevant to medical testing and healthcare organization:
                  </p>
                  
                  <Accordion type="single" collapsible className="space-y-2">
                    <AccordionItem value="item-1" className="bg-gray-700 rounded-md px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-blue-400" />
                          <span>ServiceRequest</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-gray-300">
                        <div className="prose prose-invert max-w-none">
                          <p>
                            A ServiceRequest represents an order, proposal, or plan to provide a healthcare service
                            for a patient. For medical testing, this resource is used to order laboratory tests,
                            imaging studies, and other diagnostic procedures.
                          </p>
                          
                          <h4 className="text-white">Key Elements</h4>
                          <ul>
                            <li><strong>status:</strong> The status of the request (e.g., active, completed, cancelled)</li>
                            <li><strong>intent:</strong> The intent of the request (e.g., order, original-order, reflex-order)</li>
                            <li><strong>category:</strong> Classification of service (e.g., Laboratory, Imaging)</li>
                            <li><strong>priority:</strong> Urgency of the request (routine, urgent, stat, asap)</li>
                            <li><strong>subject:</strong> Patient for whom the service is requested</li>
                            <li><strong>requester:</strong> Who/what is requesting service</li>
                            <li><strong>code:</strong> What is being requested (specific test or procedure)</li>
                          </ul>
                          
                          <h4 className="text-white">Example Use Cases</h4>
                          <ul>
                            <li>Ordering a complete blood count (CBC) test</li>
                            <li>Requesting a chest X-ray</li>
                            <li>Scheduling a follow-up consultation</li>
                          </ul>
                          
                          <h4 className="text-white">Related Resources</h4>
                          <ul>
                            <li><strong>DiagnosticReport:</strong> Contains test results</li>
                            <li><strong>Observation:</strong> Individual test results and measurements</li>
                            <li><strong>Specimen:</strong> The sample used for testing</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2" className="bg-gray-700 rounded-md px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-green-400" />
                          <span>DiagnosticReport</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-gray-300">
                        <div className="prose prose-invert max-w-none">
                          <p>
                            A DiagnosticReport represents the findings and interpretation of diagnostic tests
                            performed on patients. It includes imaging studies, laboratory tests, and pathology reports.
                          </p>
                          
                          <h4 className="text-white">Key Elements</h4>
                          <ul>
                            <li><strong>status:</strong> The status of the report (e.g., registered, preliminary, final)</li>
                            <li><strong>category:</strong> Classification of report (e.g., Laboratory, Imaging, Pathology)</li>
                            <li><strong>code:</strong> The specific diagnostic service reported</li>
                            <li><strong>subject:</strong> The patient this report is about</li>
                            <li><strong>effectiveDateTime:</strong> When the test was performed</li>
                            <li><strong>result:</strong> References to Observation resources with the actual results</li>
                            <li><strong>conclusion:</strong> Clinical interpretation of results</li>
                          </ul>
                          
                          <h4 className="text-white">Example Use Cases</h4>
                          <ul>
                            <li>Laboratory test panel results</li>
                            <li>Radiology imaging report</li>
                            <li>Pathology examination report</li>
                          </ul>
                          
                          <h4 className="text-white">Related Resources</h4>
                          <ul>
                            <li><strong>ServiceRequest:</strong> The order that led to this report</li>
                            <li><strong>Observation:</strong> Individual test results contained in the report</li>
                            <li><strong>ImagingStudy:</strong> Detailed information about imaging results</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3" className="bg-gray-700 rounded-md px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-yellow-400" />
                          <span>Observation</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-gray-300">
                        <div className="prose prose-invert max-w-none">
                          <p>
                            An Observation represents a measurement, assessment, or assertion made about a patient,
                            device, or other subject. Observations are the primary mechanism for capturing measurements
                            and diagnostic test results.
                          </p>
                          
                          <h4 className="text-white">Key Elements</h4>
                          <ul>
                            <li><strong>status:</strong> The status of the result (e.g., preliminary, final, amended)</li>
                            <li><strong>category:</strong> Classification of observation (e.g., vital-signs, laboratory)</li>
                            <li><strong>code:</strong> Type of observation (e.g., heart rate, glucose level)</li>
                            <li><strong>subject:</strong> Who or what the observation is about</li>
                            <li><strong>value[x]:</strong> The result of the observation (various data types)</li>
                            <li><strong>interpretation:</strong> High, low, normal, etc.</li>
                            <li><strong>referenceRange:</strong> Provides a normal or reference value range</li>
                          </ul>
                          
                          <h4 className="text-white">Example Use Cases</h4>
                          <ul>
                            <li>Recording vital signs like blood pressure or heart rate</li>
                            <li>Laboratory test results such as blood glucose level</li>
                            <li>Social history observations like smoking status</li>
                          </ul>
                          
                          <h4 className="text-white">Related Resources</h4>
                          <ul>
                            <li><strong>DiagnosticReport:</strong> Groups related observations</li>
                            <li><strong>ServiceRequest:</strong> The order that led to this observation</li>
                            <li><strong>Patient:</strong> The subject of the observation</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4" className="bg-gray-700 rounded-md px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <User className="w-5 h-5 mr-2 text-teal-400" />
                          <span>Patient</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-gray-300">
                        <div className="prose prose-invert max-w-none">
                          <p>
                            The Patient resource contains demographic and other administrative information about an
                            individual receiving healthcare services. It is one of the most commonly used resources
                            in FHIR implementations.
                          </p>
                          
                          <h4 className="text-white">Key Elements</h4>
                          <ul>
                            <li><strong>identifier:</strong> Business identifiers for the patient (e.g., MRN)</li>
                            <li><strong>active:</strong> Whether the patient record is active</li>
                            <li><strong>name:</strong> A name associated with the patient</li>
                            <li><strong>telecom:</strong> Contact details (phone, email)</li>
                            <li><strong>gender:</strong> Administrative gender</li>
                            <li><strong>birthDate:</strong> The date of birth</li>
                            <li><strong>address:</strong> Addresses associated with the patient</li>
                            <li><strong>contact:</strong> A contact party (e.g., guardian, relative)</li>
                          </ul>
                          
                          <h4 className="text-white">Example Use Cases</h4>
                          <ul>
                            <li>Registering a new patient in a healthcare system</li>
                            <li>Updating patient contact information</li>
                            <li>Retrieving patient demographic data for appointments</li>
                          </ul>
                          
                          <h4 className="text-white">Related Resources</h4>
                          <ul>
                            <li><strong>RelatedPerson:</strong> Family members, guardians, or caregivers</li>
                            <li><strong>Person:</strong> Generic person record that might link to a patient</li>
                            <li><strong>Group:</strong> Collection of patients with common characteristics</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5" className="bg-gray-700 rounded-md px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <UserCog className="w-5 h-5 mr-2 text-orange-400" />
                          <span>Practitioner</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-gray-300">
                        <div className="prose prose-invert max-w-none">
                          <p>
                            The Practitioner resource represents a person who is directly or indirectly involved in
                            providing healthcare services. This includes physicians, nurses, technicians, and other
                            healthcare professionals.
                          </p>
                          
                          <h4 className="text-white">Key Elements</h4>
                          <ul>
                            <li><strong>identifier:</strong> Business identifiers (e.g., NPI number, license number)</li>
                            <li><strong>active:</strong> Whether the practitioner record is active</li>
                            <li><strong>name:</strong> The name(s) of the practitioner</li>
                            <li><strong>telecom:</strong> Contact details for the practitioner</li>
                            <li><strong>address:</strong> Address(es) of the practitioner</li>
                            <li><strong>gender:</strong> Administrative gender</li>
                            <li><strong>qualification:</strong> Qualifications, certifications, or training</li>
                          </ul>
                          
                          <h4 className="text-white">Example Use Cases</h4>
                          <ul>
                            <li>Storing information about care providers</li>
                            <li>Managing provider credentials and qualifications</li>
                            <li>Assigning practitioners to service requests or appointments</li>
                          </ul>
                          
                          <h4 className="text-white">Related Resources</h4>
                          <ul>
                            <li><strong>PractitionerRole:</strong> A practitioner's role at an organization</li>
                            <li><strong>Organization:</strong> The organization the practitioner works for</li>
                            <li><strong>Schedule:</strong> Availability of the practitioner for appointments</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6" className="bg-gray-700 rounded-md px-4">
                      <AccordionTrigger className="py-4">
                        <div className="flex items-center">
                          <Building className="w-5 h-5 mr-2 text-purple-400" />
                          <span>Organization</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-gray-300">
                        <div className="prose prose-invert max-w-none">
                          <p>
                            The Organization resource represents a formally or informally recognized grouping of people
                            or organizations formed for the purpose of achieving some form of collective action in the
                            healthcare domain.
                          </p>
                          
                          <h4 className="text-white">Key Elements</h4>
                          <ul>
                            <li><strong>identifier:</strong> Business identifiers (e.g., tax ID, facility ID)</li>
                            <li><strong>active:</strong> Whether the organization record is active</li>
                            <li><strong>type:</strong> Kind of organization (e.g., hospital, laboratory, practice)</li>
                            <li><strong>name:</strong> Name used for the organization</li>
                            <li><strong>telecom:</strong> Contact details for the organization</li>
                            <li><strong>address:</strong> Address(es) for the organization</li>
                            <li><strong>partOf:</strong> The organization of which this organization is a part</li>
                          </ul>
                          
                          <h4 className="text-white">Example Use Cases</h4>
                          <ul>
                            <li>Managing healthcare facilities and networks</li>
                            <li>Establishing hierarchical relationships between organizations</li>
                            <li>Associating practitioners with their employer organizations</li>
                          </ul>
                          
                          <h4 className="text-white">Organization Relationships and Facilities</h4>
                          <p>
                            The Organization resource is essential for representing complex healthcare entities that
                            may own or operate multiple facilities. For example:
                          </p>
                          <ul>
                            <li>
                              <strong>Parent-Child Relationships:</strong> A healthcare system (parent organization) 
                              may own multiple hospitals, clinics, or laboratory facilities (child organizations). 
                              These relationships are modeled using the <code>partOf</code> element.
                            </li>
                            <li>
                              <strong>Location Association:</strong> Organizations can be linked to physical locations
                              using the Location resource, which represents the physical places where services are provided.
                            </li>
                            <li>
                              <strong>Multi-Facility Operations:</strong> For healthcare providers operating across 
                              multiple facilities, an Organization can manage shared resources, policies, and staff
                              across locations while maintaining distinct facility identities.
                            </li>
                          </ul>
                          
                          <h4 className="text-white">Related Resources</h4>
                          <ul>
                            <li><strong>Location:</strong> Physical location where services are provided</li>
                            <li><strong>Endpoint:</strong> Technical details for connecting to services</li>
                            <li><strong>OrganizationAffiliation:</strong> Relationships between organizations</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>FHIR Resource Relationships</CardTitle>
                  <CardDescription>How FHIR resources connect to form a complete healthcare record</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <p>
                      FHIR resources rarely exist in isolation. They form a network of connected information
                      that represents the complexity of healthcare delivery. Understanding these relationships
                      is key to effective FHIR implementation.
                    </p>
                    
                    <h3>Common Relationship Patterns</h3>
                    
                    <h4>Diagnostic Testing Workflow</h4>
                    <p>
                      A typical diagnostic testing workflow involves multiple interconnected resources:
                    </p>
                    <ol>
                      <li>A <strong>ServiceRequest</strong> is created to order a test for a <strong>Patient</strong></li>
                      <li>A <strong>Specimen</strong> is collected and sent to the laboratory</li>
                      <li>Multiple <strong>Observation</strong> resources are created with the test results</li>
                      <li>A <strong>DiagnosticReport</strong> collects and interprets all the observations</li>
                    </ol>
                    
                    <div className="bg-gray-700 p-4 rounded-lg my-4">
                      <h4 className="text-white">Example: Complete Blood Count (CBC) Test</h4>
                      <ul className="list-none pl-0">
                        <li className="flex items-center mb-2">
                          <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center mr-3">1</span>
                          <span className="flex-grow"><strong>ServiceRequest</strong>: Order for CBC test</span>
                        </li>
                        <li className="flex items-center mb-2">
                          <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center mr-3">2</span>
                          <span className="flex-grow"><strong>Specimen</strong>: Blood sample collected</span>
                        </li>
                        <li className="flex items-center mb-2">
                          <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center mr-3">3</span>
                          <span className="flex-grow"><strong>Observations</strong>: Individual measurements (e.g., hemoglobin, white blood cell count)</span>
                        </li>
                        <li className="flex items-center">
                          <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center mr-3">4</span>
                          <span className="flex-grow"><strong>DiagnosticReport</strong>: Complete CBC report with interpretations</span>
                        </li>
                      </ul>
                    </div>
                    
                    <h4>Organizational Structure Relationships</h4>
                    <p>
                      Healthcare organizations often have complex structures:
                    </p>
                    <ul>
                      <li>A healthcare system (<strong>Organization</strong>) may have multiple facilities</li>
                      <li>Each facility may be its own <strong>Organization</strong> linked to the parent via the <code>partOf</code> element</li>
                      <li>Physical buildings are represented as <strong>Location</strong> resources</li>
                      <li><strong>Practitioners</strong> work for Organizations in specific <strong>PractitionerRoles</strong></li>
                    </ul>
                    
                    <div className="bg-gray-700 p-4 rounded-lg my-4">
                      <h4 className="text-white">Example: Multi-Facility Healthcare System</h4>
                      <ul className="list-none pl-0">
                        <li className="flex items-center mb-2">
                          <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center mr-3">1</span>
                          <span className="flex-grow"><strong>Organization</strong>: "Metro Health System" (parent)</span>
                        </li>
                        <li className="flex items-center mb-2 ml-8">
                          <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center mr-3">2</span>
                          <span className="flex-grow"><strong>Organization</strong>: "Metro General Hospital" (child, partOf Metro Health)</span>
                        </li>
                        <li className="flex items-center mb-2 ml-16">
                          <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center mr-3">3</span>
                          <span className="flex-grow"><strong>Location</strong>: Physical hospital building</span>
                        </li>
                        <li className="flex items-center mb-2 ml-8">
                          <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center mr-3">4</span>
                          <span className="flex-grow"><strong>Organization</strong>: "Metro Outpatient Center" (child, partOf Metro Health)</span>
                        </li>
                        <li className="flex items-center mb-2 ml-16">
                          <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center mr-3">5</span>
                          <span className="flex-grow"><strong>Location</strong>: Physical clinic building</span>
                        </li>
                        <li className="flex items-center ml-8">
                          <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center mr-3">6</span>
                          <span className="flex-grow"><strong>Organization</strong>: "Metro Laboratory Services" (child, partOf Metro Health)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* FHIR Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>FHIR Validator</CardTitle>
                  <CardDescription>Validate your FHIR resources against the official schemas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    The FHIR Validator helps ensure your FHIR resources conform to the specification.
                    This tool will be implemented in a future update to allow direct validation of FHIR JSON/XML.
                  </p>
                  
                  <div className="bg-gray-700 p-4 rounded-md mb-4 text-gray-300">
                    <p className="font-medium mb-2">Coming Soon</p>
                    <p>
                      This feature is currently in development. In the meantime, you can use
                      these external FHIR validation tools:
                    </p>
                    <ul className="mt-2 space-y-1">
                      <li>
                        <a href="https://validator.fhir.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          Official HL7 FHIR Validator
                        </a>
                      </li>
                      <li>
                        <a href="https://hapi.fhir.org/resource-validator" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          HAPI FHIR Validator
                        </a>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>FHIR Data Explorer</CardTitle>
                  <CardDescription>Interactive tool to explore example FHIR resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    The FHIR Data Explorer allows you to visualize and explore the structure of FHIR resources.
                    This feature will be implemented in a future update.
                  </p>
                  
                  <div className="bg-gray-700 p-4 rounded-md mb-4 text-gray-300">
                    <p className="font-medium mb-2">Coming Soon</p>
                    <p>
                      This feature is currently in development. In the meantime, you can explore FHIR 
                      resources using these public sandboxes:
                    </p>
                    <ul className="mt-2 space-y-1">
                      <li>
                        <a href="https://hapi.fhir.org/baseR4/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          HAPI FHIR Public Server
                        </a>
                      </li>
                      <li>
                        <a href="https://launch.smarthealthit.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          SMART Health IT Sandbox
                        </a>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Export to FHIR</CardTitle>
                  <CardDescription>Export your MediRefs test data to FHIR format</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    MediRefs allows you to export your test data to FHIR-compliant format for use in other
                    healthcare systems. This feature is already available in the Test Management section.
                  </p>
                  
                  <Link href="/manage" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                    Go to Test Management
                  </Link>
                  
                  <div className="mt-6 bg-gray-700 p-4 rounded-md text-gray-300">
                    <h3 className="font-medium text-white mb-2">What You Can Export</h3>
                    <p className="mb-2">
                      When you export your test data to FHIR, the following conversions are performed:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Each test is converted to a <strong>ServiceRequest</strong> resource</li>
                      <li>Tests with CPT codes include proper coding information</li>
                      <li>Laboratory tests include LOINC codes where available</li>
                      <li>Imaging studies include SNOMED codes where available</li>
                      <li>All resources are bundled in a FHIR-compliant document</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Video Resources Tab */}
            <TabsContent value="videos" className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>FHIR Educational Videos</CardTitle>
                  <CardDescription>Learn about FHIR through video tutorials and presentations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Youtube className="w-12 h-12 mx-auto text-red-500 mb-2" />
                          <p className="text-sm text-gray-300">Video embed: "Introduction to FHIR for Developers"</p>
                          <p className="text-xs text-gray-400">Click to view on YouTube</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">Introduction to FHIR for Developers</h3>
                        <p className="text-sm text-gray-300 mb-2">
                          A comprehensive introduction to FHIR architecture, resources, and implementation approaches.
                        </p>
                        <a href="https://www.youtube.com/watch?v=YbQcJj1GqH0" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Youtube className="w-12 h-12 mx-auto text-red-500 mb-2" />
                          <p className="text-sm text-gray-300">Video embed: "FHIR for Clinicians"</p>
                          <p className="text-xs text-gray-400">Click to view on YouTube</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">FHIR for Clinicians</h3>
                        <p className="text-sm text-gray-300 mb-2">
                          A practical explanation of how FHIR impacts clinical workflows and improves healthcare delivery.
                        </p>
                        <a href="https://www.youtube.com/watch?v=MjlD1xfXj68" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Youtube className="w-12 h-12 mx-auto text-red-500 mb-2" />
                          <p className="text-sm text-gray-300">Video embed: "FHIR Resource Relationships"</p>
                          <p className="text-xs text-gray-400">Click to view on YouTube</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">FHIR Resource Relationships</h3>
                        <p className="text-sm text-gray-300 mb-2">
                          Deep dive into how FHIR resources relate to each other to model complex healthcare scenarios.
                        </p>
                        <a href="https://www.youtube.com/watch?v=yjIX6VfXnsk" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <div className="text-center p-4">
                          <Youtube className="w-12 h-12 mx-auto text-red-500 mb-2" />
                          <p className="text-sm text-gray-300">Video embed: "Implementing FHIR APIs"</p>
                          <p className="text-xs text-gray-400">Click to view on YouTube</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium mb-1">Implementing FHIR APIs</h3>
                        <p className="text-sm text-gray-300 mb-2">
                          Technical walkthrough of building FHIR-compliant APIs for healthcare applications.
                        </p>
                        <a href="https://www.youtube.com/watch?v=VlylGwG7QZ4" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">FHIR Conference Recordings</h3>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <Youtube className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <a href="https://www.youtube.com/playlist?list=PLK2oAGq9_JVo9hRGpWRaVlOPcwXdeXDuy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                              HL7 FHIR DevDays
                            </a>
                            <p className="text-sm text-gray-300">
                              Recordings from FHIR DevDays, the premier FHIR implementation conference.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Youtube className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <a href="https://www.youtube.com/c/HL7org/videos" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                              HL7 Official Channel
                            </a>
                            <p className="text-sm text-gray-300">
                              Official videos from HL7, the organization behind FHIR.
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <Youtube className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <a href="https://www.youtube.com/playlist?list=PLNJkC1Sq-a1VgDCetkF1aGWr6blCm8e7f" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                              FHIR Implementation Tutorials
                            </a>
                            <p className="text-sm text-gray-300">
                              Step-by-step tutorials for implementing FHIR in various programming languages.
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* External resources section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">External FHIR Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <Book className="w-5 h-5 mr-2 text-blue-400" />
                  Official Documentation
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://hl7.org/fhir/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      HL7 FHIR Specification
                    </a>
                    <p className="text-sm text-gray-300">The definitive guide to FHIR</p>
                  </li>
                  <li>
                    <a href="https://build.fhir.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      FHIR Build
                    </a>
                    <p className="text-sm text-gray-300">Continuous integration build of the FHIR specification</p>
                  </li>
                  <li>
                    <a href="https://registry.fhir.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      FHIR Registry
                    </a>
                    <p className="text-sm text-gray-300">Registry of FHIR implementation guides and packages</p>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-blue-400" />
                  Development Tools
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://simplifier.net/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      Simplifier.net
                    </a>
                    <p className="text-sm text-gray-300">FHIR profile editor and registry</p>
                  </li>
                  <li>
                    <a href="https://hapifhir.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      HAPI FHIR
                    </a>
                    <p className="text-sm text-gray-300">Java implementation of the FHIR specification</p>
                  </li>
                  <li>
                    <a href="https://github.com/microsoft/fhir-server" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      Microsoft FHIR Server
                    </a>
                    <p className="text-sm text-gray-300">Open-source FHIR server implementation</p>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-400" />
                  Community Resources
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a href="https://chat.fhir.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      FHIR Chat
                    </a>
                    <p className="text-sm text-gray-300">Community discussion and support</p>
                  </li>
                  <li>
                    <a href="https://stackoverflow.com/questions/tagged/fhir" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      Stack Overflow
                    </a>
                    <p className="text-sm text-gray-300">FHIR-tagged questions and answers</p>
                  </li>
                  <li>
                    <a href="https://confluence.hl7.org/display/FHIR/Public+Test+Servers" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 block">
                      Public FHIR Servers
                    </a>
                    <p className="text-sm text-gray-300">List of publicly available FHIR test servers</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}