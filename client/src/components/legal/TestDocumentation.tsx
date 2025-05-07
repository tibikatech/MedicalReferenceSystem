import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHead 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Code, FileText, FileCode, Info, Book, Tag, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface TestDocumentationProps {
  searchQuery?: string;
}

export default function TestDocumentation({ searchQuery = '' }: TestDocumentationProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCodeSystem, setSelectedCodeSystem] = useState('all');
  
  return (
    <div className="space-y-6">
      {/* Intro section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Medical Test Documentation</h2>
        <p className="text-gray-300">
          Comprehensive documentation for medical tests with Kenya/Africa-specific reference ranges and guidance.
          Includes mappings between different coding systems including CPT, LOINC, and SNOMED CT codes.
        </p>
      </div>
      
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search test documentation..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs 
          value={selectedCodeSystem} 
          onValueChange={setSelectedCodeSystem}
          className="border border-gray-700 rounded-md"
        >
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="loinc" className="flex-1">LOINC</TabsTrigger>
            <TabsTrigger value="snomed" className="flex-1">SNOMED</TabsTrigger>
            <TabsTrigger value="cpt" className="flex-1">CPT</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Code Mapping Interface */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Code className="mr-2 h-5 w-5 text-blue-400" />
            Test Code Mapping Interface
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="common">
            <TabsList className="mb-4">
              <TabsTrigger value="common">Common Tests</TabsTrigger>
              <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
              <TabsTrigger value="imaging">Imaging</TabsTrigger>
              <TabsTrigger value="procedures">Procedures</TabsTrigger>
            </TabsList>
            
            <TabsContent value="common">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead>CPT Code</TableHead>
                      <TableHead>LOINC Code</TableHead>
                      <TableHead>SNOMED CT</TableHead>
                      <TableHead>Kenya EDL</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Complete Blood Count (CBC)</TableCell>
                      <TableCell>85027</TableCell>
                      <TableCell>58410-2</TableCell>
                      <TableCell>26604007</TableCell>
                      <TableCell>EDL-KE-H001</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Comprehensive Metabolic Panel</TableCell>
                      <TableCell>80053</TableCell>
                      <TableCell>24323-8</TableCell>
                      <TableCell>27171005</TableCell>
                      <TableCell>EDL-KE-C004</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Hemoglobin A1C</TableCell>
                      <TableCell>83036</TableCell>
                      <TableCell>4548-4</TableCell>
                      <TableCell>43396009</TableCell>
                      <TableCell>EDL-KE-D002</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Chest X-ray</TableCell>
                      <TableCell>71045</TableCell>
                      <TableCell>24627-2</TableCell>
                      <TableCell>399208008</TableCell>
                      <TableCell>EDL-KE-R001</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">HIV Antibody</TableCell>
                      <TableCell>86703</TableCell>
                      <TableCell>31201-7</TableCell>
                      <TableCell>26126000</TableCell>
                      <TableCell>EDL-KE-I003</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="laboratory">
              <div className="bg-gray-900 p-4 rounded-md mb-4">
                <p className="text-gray-300">
                  Laboratory test codes with specific African reference ranges. The table includes Kenya Essential Diagnostics List mappings
                  and Africa CDC recommended diagnostics.
                </p>
              </div>
              
              {/* Table would be here, similar to the one above */}
              <div className="flex justify-center py-8">
                <p className="text-gray-400">Select the Laboratory tab to view laboratory test code mappings</p>
              </div>
            </TabsContent>
            
            <TabsContent value="imaging">
              <div className="bg-gray-900 p-4 rounded-md mb-4">
                <p className="text-gray-300">
                  Imaging study codes with resource-appropriate recommendations for different facility levels in Africa.
                </p>
              </div>
              
              {/* Table would be here */}
              <div className="flex justify-center py-8">
                <p className="text-gray-400">Select the Imaging tab to view imaging study code mappings</p>
              </div>
            </TabsContent>
            
            <TabsContent value="procedures">
              <div className="bg-gray-900 p-4 rounded-md mb-4">
                <p className="text-gray-300">
                  Procedure codes with Africa-specific context, including alternative approaches for resource-limited settings.
                </p>
              </div>
              
              {/* Table would be here */}
              <div className="flex justify-center py-8">
                <p className="text-gray-400">Select the Procedures tab to view procedure code mappings</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Reference Guides Section */}
      <Card className="bg-gray-800 border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Book className="mr-2 h-5 w-5 text-green-400" />
            Kenya & Africa Test Reference Guides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-blue-400" />
                  Kenya-Specific Reference Ranges
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Reference ranges specifically validated for Kenyan populations, accounting for
                  genetic, environmental, and dietary factors that may influence test results.
                </p>
                <div className="mt-3 flex justify-between">
                  <Badge className="bg-blue-600">Laboratory Tests</Badge>
                  <Button variant="ghost" size="sm" className="h-8 p-0">
                    <FileText className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-green-400" />
                  Resource-Limited Settings Protocols
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Testing protocols optimized for facilities with limited resources, including
                  alternative testing methodologies and specimen handling guidelines.
                </p>
                <div className="mt-3 flex justify-between">
                  <Badge className="bg-green-600">Clinical Procedures</Badge>
                  <Button variant="ghost" size="sm" className="h-8 p-0">
                    <FileText className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-purple-400" />
                  Africa CDC Diagnostic Guidelines
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Official diagnostic recommendations from the Africa Centers for Disease Control
                  and Prevention, with focus on priority diseases in the region.
                </p>
                <div className="mt-3 flex justify-between">
                  <Badge className="bg-purple-600">Infectious Diseases</Badge>
                  <Button variant="ghost" size="sm" className="h-8 p-0">
                    <FileText className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium flex items-center">
                  <Tag className="mr-2 h-4 w-4 text-yellow-400" />
                  East African Community Standards
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Harmonized testing standards across the East African Community member states,
                  facilitating cross-border healthcare and referrals.
                </p>
                <div className="mt-3 flex justify-between">
                  <Badge className="bg-yellow-600">Regional Standards</Badge>
                  <Button variant="ghost" size="sm" className="h-8 p-0">
                    <FileText className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Interpretation Guides */}
      <Card className="bg-gray-800 border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Info className="mr-2 h-5 w-5 text-yellow-400" />
            Clinical Interpretation Guides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-700 p-4 rounded-md mb-4">
            <p className="text-gray-300">
              Context-specific guides for interpreting test results in African healthcare settings,
              accounting for regional disease prevalence, resource availability, and cultural factors.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <FileCode className="mr-2 h-4 w-4 text-blue-400" />
                  Interpreting Laboratory Results in High TB Prevalence Regions
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  This guide provides context for interpreting common lab tests in regions with high tuberculosis
                  prevalence, including interfering factors and alternative diagnostic approaches.
                </p>
                <div className="flex items-center mt-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-400">
                    Important considerations for HIV co-infection
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span className="text-sm text-green-400">
                    Validated with Kenya TB Program data
                  </span>
                </div>
                <Button className="mt-3" size="sm">Download Guide</Button>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <FileCode className="mr-2 h-4 w-4 text-green-400" />
                  Malaria Testing Interpretation for Different Endemic Zones
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Guidelines for interpreting malaria test results across different transmission zones in Africa,
                  with specific protocols for rapid diagnostic tests and microscopy.
                </p>
                <Button className="mt-3" size="sm">Download Guide</Button>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <FileCode className="mr-2 h-4 w-4 text-purple-400" />
                  Interpreting Diagnostic Tests in Pediatric Populations
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Age-specific guidance for interpreting diagnostic test results in children,
                  with reference ranges validated in African pediatric populations.
                </p>
                <Button className="mt-3" size="sm">Download Guide</Button>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <FileCode className="mr-2 h-4 w-4 text-red-400" />
                  COVID-19 Testing Guidelines for Resource-Limited Settings
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Strategies for COVID-19 testing in settings with limited laboratory capacity,
                  including testing algorithms and result interpretation.
                </p>
                <Button className="mt-3" size="sm">Download Guide</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* External Resources */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">External Test Documentation Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h4 className="font-medium flex items-center">
                <ExternalLink className="mr-2 h-4 w-4 text-blue-400" />
                Kenya Ministry of Health
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                Official testing guidelines and protocols from the Kenya Ministry of Health.
              </p>
              <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300">
                Visit Resource
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h4 className="font-medium flex items-center">
                <ExternalLink className="mr-2 h-4 w-4 text-blue-400" />
                Africa CDC
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                Continental guidelines and reference materials for diagnostic testing.
              </p>
              <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300">
                Visit Resource
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h4 className="font-medium flex items-center">
                <ExternalLink className="mr-2 h-4 w-4 text-blue-400" />
                WHO Africa Regional Office
              </h4>
              <p className="text-sm text-gray-300 mt-1">
                World Health Organization resources specific to the African region.
              </p>
              <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300">
                Visit Resource
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}