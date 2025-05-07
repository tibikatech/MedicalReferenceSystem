import { useState, useEffect } from 'react';
import { useRegulatoryDocuments } from '@/hooks/useLegalData';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Download, Search, Calendar, AlertCircle, MapPin, BookOpen, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RegulatoryFrameworkProps {
  searchQuery?: string;
}

// Country options - focusing on East African Community
const countryOptions = [
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Tanzania', label: 'Tanzania' },
  { value: 'Uganda', label: 'Uganda' },
  { value: 'Rwanda', label: 'Rwanda' },
  { value: 'Burundi', label: 'Burundi' },
  { value: 'South Sudan', label: 'South Sudan' },
  { value: 'Ethiopia', label: 'Ethiopia' },
  { value: 'Nigeria', label: 'Nigeria' },
  { value: 'South Africa', label: 'South Africa' },
];

// Document type options
const documentTypeOptions = [
  { value: 'Regulation', label: 'Regulation' },
  { value: 'Guideline', label: 'Guideline' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Policy', label: 'Policy' },
  { value: 'Act', label: 'Act' },
];

// Region options
const regionOptions = [
  { value: 'East Africa', label: 'East Africa' },
  { value: 'West Africa', label: 'West Africa' },
  { value: 'Southern Africa', label: 'Southern Africa' },
  { value: 'Central Africa', label: 'Central Africa' },
  { value: 'North Africa', label: 'North Africa' },
];

export default function RegulatoryFramework({ searchQuery = '' }: RegulatoryFrameworkProps) {
  // States for filters
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get regulatory documents data
  const { data: documents, isLoading, isError } = useRegulatoryDocuments(
    selectedCountry || undefined,
    selectedRegion || undefined,
    selectedDocType || undefined
  );

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Filter documents by search query
  const filteredDocuments = documents?.filter(doc => {
    if (!localSearchQuery) return true;
    
    const query = localSearchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      (doc.summary && doc.summary.toLowerCase().includes(query)) ||
      doc.country.toLowerCase().includes(query) ||
      (doc.region && doc.region.toLowerCase().includes(query))
    );
  });

  // Handle document click (for future implementation of document viewer)
  const handleDocumentClick = (documentId: number) => {
    console.log(`Clicked on document ${documentId}`);
    // Future implementation: Open document viewer
  };

  // Loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex gap-4 mb-5">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="bg-red-900 bg-opacity-20 border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 h-6 w-6" />
            <h3 className="text-xl font-medium text-white">Error Loading Regulatory Documents</h3>
          </div>
          <p className="mt-2 text-gray-300">
            We encountered an error while loading the regulatory documents. Please try again later.
          </p>
          <Button variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no documents or empty state
  const noDocuments = !filteredDocuments || filteredDocuments.length === 0;

  return (
    <div className="space-y-6">
      {/* Intro text */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Africa Regulatory Framework</h2>
        <p className="text-gray-300">
          Access comprehensive healthcare regulations, standards, and guidelines specific to Kenya and other African nations. 
          Our regulatory framework documentation provides essential information for healthcare providers ensuring compliance with local laws.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select
          value={selectedCountry || ''}
          onValueChange={(value) => setSelectedCountry(value || null)}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_countries">All Countries</SelectItem>
            {countryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedRegion || ''}
          onValueChange={(value) => setSelectedRegion(value || null)}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_regions">All Regions</SelectItem>
            {regionOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedDocType || ''}
          onValueChange={(value) => setSelectedDocType(value || null)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_document_types">All Document Types</SelectItem>
            {documentTypeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-1 bg-gray-800 rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="px-2 py-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="px-2 py-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Applied filters */}
      {(selectedCountry || selectedRegion || selectedDocType || localSearchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCountry && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-900 bg-opacity-20 border-blue-800">
              <MapPin className="h-3 w-3" /> {selectedCountry}
              <button className="ml-1" onClick={() => setSelectedCountry(null)}>×</button>
            </Badge>
          )}
          {selectedRegion && (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-900 bg-opacity-20 border-green-800">
              <MapPin className="h-3 w-3" /> {selectedRegion}
              <button className="ml-1" onClick={() => setSelectedRegion(null)}>×</button>
            </Badge>
          )}
          {selectedDocType && (
            <Badge variant="outline" className="flex items-center gap-1 bg-purple-900 bg-opacity-20 border-purple-800">
              <FileText className="h-3 w-3" /> {selectedDocType}
              <button className="ml-1" onClick={() => setSelectedDocType(null)}>×</button>
            </Badge>
          )}
          {localSearchQuery && (
            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-900 bg-opacity-20 border-yellow-800">
              <Search className="h-3 w-3" /> "{localSearchQuery}"
              <button className="ml-1" onClick={() => setLocalSearchQuery('')}>×</button>
            </Badge>
          )}
          <button 
            className="text-sm text-blue-400 hover:text-blue-300"
            onClick={() => {
              setSelectedCountry(null);
              setSelectedRegion(null);
              setSelectedDocType(null);
              setLocalSearchQuery('');
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Empty state */}
      {noDocuments && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-white">No Documents Found</h3>
            <p className="mt-2 text-gray-400 max-w-md mx-auto">
              {(selectedCountry || selectedRegion || selectedDocType || localSearchQuery) ?
                "No documents match your current filters. Try adjusting your search criteria." :
                "There are no regulatory documents available yet. Please check back later."}
            </p>
            {(selectedCountry || selectedRegion || selectedDocType || localSearchQuery) && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSelectedCountry(null);
                  setSelectedRegion(null);
                  setSelectedDocType(null);
                  setLocalSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document list */}
      {!noDocuments && (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" 
          : "space-y-4"
        }>
          {/* This would display actual documents when available */}
          {/* For now, we'll display sample cards to show the UI */}
          
          {/* Kenya MOH Guidelines */}
          <Card 
            className="bg-gray-800 border-gray-700 hover:border-blue-600 cursor-pointer transition-all" 
            onClick={() => handleDocumentClick(1)}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <Badge className="bg-blue-600 hover:bg-blue-700">Guideline</Badge>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-lg font-semibold mt-3">Kenya National Guidelines for Laboratory Testing</h3>
              <div className="flex items-center mt-1 text-gray-400 text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                <span>Kenya</span>
                <span className="mx-2">•</span>
                <Calendar className="h-3 w-3 mr-1" />
                <span>2023</span>
              </div>
              <p className="mt-3 text-gray-300 text-sm line-clamp-3">
                Comprehensive guidelines for medical laboratory testing in Kenya, including sample collection,
                testing protocols, quality assurance, and reporting standards.
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant="outline" className="bg-gray-700 border-gray-600">Diagnostics</Badge>
                <Badge variant="outline" className="bg-gray-700 border-gray-600">Official</Badge>
              </div>
            </CardContent>
          </Card>

          {/* EAC Standards */}
          <Card 
            className="bg-gray-800 border-gray-700 hover:border-blue-600 cursor-pointer transition-all" 
            onClick={() => handleDocumentClick(2)}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <Badge className="bg-green-600 hover:bg-green-700">Standard</Badge>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-lg font-semibold mt-3">East African Community Medical Device Standards</h3>
              <div className="flex items-center mt-1 text-gray-400 text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                <span>East Africa</span>
                <span className="mx-2">•</span>
                <Calendar className="h-3 w-3 mr-1" />
                <span>2022</span>
              </div>
              <p className="mt-3 text-gray-300 text-sm line-clamp-3">
                Harmonized standards for medical devices and diagnostic equipment in the East African Community
                region, including requirements for registration, safety, and performance.
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant="outline" className="bg-gray-700 border-gray-600">Medical Devices</Badge>
                <Badge variant="outline" className="bg-gray-700 border-gray-600">Regional</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Kenya Pharmacy Act */}
          <Card 
            className="bg-gray-800 border-gray-700 hover:border-blue-600 cursor-pointer transition-all" 
            onClick={() => handleDocumentClick(3)}
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <Badge className="bg-purple-600 hover:bg-purple-700">Act</Badge>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-lg font-semibold mt-3">Pharmacy and Poisons Act of Kenya (Revised)</h3>
              <div className="flex items-center mt-1 text-gray-400 text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                <span>Kenya</span>
                <span className="mx-2">•</span>
                <Calendar className="h-3 w-3 mr-1" />
                <span>2021</span>
              </div>
              <p className="mt-3 text-gray-300 text-sm line-clamp-3">
                Legal framework governing the practice of pharmacy, regulation of medicines, and control
                of pharmaceutical products in Kenya, including import, export, and distribution requirements.
              </p>
              <div className="mt-4 flex gap-2">
                <Badge variant="outline" className="bg-gray-700 border-gray-600">Legislation</Badge>
                <Badge variant="outline" className="bg-gray-700 border-gray-600">Pharmaceuticals</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Additional cards would be generated from actual document data */}
        </div>
      )}

      {/* International comparisons */}
      <div className="mt-10 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <BookOpen className="mr-2 h-5 w-5 text-blue-400" />
          International Standards & Regulatory Crosswalk
        </h3>
        <p className="text-gray-300 mb-4">
          Compare African regulatory frameworks with international standards from organizations like WHO, 
          US FDA, and EU EMA. Understand key differences and harmonization efforts.
        </p>
        
        <Tabs defaultValue="who">
          <TabsList className="mb-4">
            <TabsTrigger value="who">WHO</TabsTrigger>
            <TabsTrigger value="fda">US FDA</TabsTrigger>
            <TabsTrigger value="ema">EU EMA</TabsTrigger>
            <TabsTrigger value="icmra">ICMRA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="who">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h4 className="font-medium">WHO Guidelines for Medical Testing</h4>
                <p className="text-sm text-gray-300 mt-1">
                  The World Health Organization provides global standards and prequalification 
                  programs that are particularly relevant to African nations seeking to improve 
                  healthcare testing quality.
                </p>
                <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                  View Comparison <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fda">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h4 className="font-medium">US FDA Regulatory Framework</h4>
                <p className="text-sm text-gray-300 mt-1">
                  The U.S. Food and Drug Administration has established comprehensive regulations 
                  for medical testing and devices that influence global standards.
                </p>
                <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                  View Comparison <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ema">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h4 className="font-medium">European Medicines Agency Framework</h4>
                <p className="text-sm text-gray-300 mt-1">
                  The European regulatory approach to medical testing and devices, with particular 
                  relevance to harmonization efforts with African regulatory bodies.
                </p>
                <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                  View Comparison <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="icmra">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h4 className="font-medium">International Coalition of Medicines Regulatory Authorities</h4>
                <p className="text-sm text-gray-300 mt-1">
                  Global coalition working to coordinate regulatory approaches across countries,
                  including several African regulatory authorities.
                </p>
                <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                  View Comparison <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}