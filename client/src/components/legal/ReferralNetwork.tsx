import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHead 
} from '@/components/ui/table';
import { useReferralFacilities } from '@/hooks/useLegalData';
import { Search, Building, MapPin, Phone, Mail, FileText, ExternalLink, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

interface ReferralNetworkProps {
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
];

// Facility type options
const facilityTypeOptions = [
  { value: 'Hospital', label: 'Hospital' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Clinic', label: 'Clinic' },
  { value: 'Research Center', label: 'Research Center' },
  { value: 'Diagnostic Center', label: 'Diagnostic Center' },
];

// Test capabilities - for filtering
const testCapabilityOptions = [
  { value: 'Molecular Diagnostics', label: 'Molecular Diagnostics' },
  { value: 'Pathology', label: 'Pathology' },
  { value: 'Medical Imaging', label: 'Medical Imaging' },
  { value: 'Specialized Tests', label: 'Specialized Tests' },
  { value: 'Point-of-Care Testing', label: 'Point-of-Care Testing' },
];

export default function ReferralNetwork({ searchQuery = '' }: ReferralNetworkProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedFacilityType, setSelectedFacilityType] = useState<string | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [activeFacility, setActiveFacility] = useState<number | null>(null);
  
  // Get referral facilities data 
  const { data: facilities, isLoading, isError } = useReferralFacilities(
    selectedCountry || undefined,
    undefined, 
    selectedFacilityType || undefined
  );

  // Helper function for getting capability badges with appropriate colors
  const getCapabilityBadge = (capability: string) => {
    const colors: Record<string, string> = {
      'Molecular Diagnostics': 'bg-blue-900 border-blue-700',
      'Pathology': 'bg-purple-900 border-purple-700',
      'Medical Imaging': 'bg-green-900 border-green-700',
      'Specialized Tests': 'bg-yellow-900 border-yellow-700',
      'Point-of-Care Testing': 'bg-orange-900 border-orange-700',
    };
    
    return (
      <Badge 
        key={capability} 
        variant="outline" 
        className={`${colors[capability] || 'bg-gray-900 border-gray-700'} mr-2 mb-2`}
      >
        {capability}
      </Badge>
    );
  };

  // Sample facility data (would be replaced with actual API data)
  const exampleFacilities = [
    {
      id: 1,
      facilityName: "Kenya National Hospital",
      country: "Kenya",
      region: "Nairobi",
      facilityType: "Hospital",
      specializationAreas: ["General Medicine", "Cardiology", "Oncology"],
      contactInformation: { 
        email: "info@knh.ke", 
        phone: "+254 20 1234567",
        website: "https://knh.ke",
        address: "Hospital Road, Nairobi, Kenya"
      },
      testCapabilities: ["Molecular Diagnostics", "Pathology", "Medical Imaging", "Specialized Tests"],
      accreditations: ["ISO 15189", "Kenya Medical Laboratory Technicians Board"]
    },
    {
      id: 2,
      facilityName: "Aga Khan University Hospital Laboratory",
      country: "Kenya",
      region: "Nairobi",
      facilityType: "Laboratory",
      specializationAreas: ["Clinical Pathology", "Molecular Biology", "Microbiology"],
      contactInformation: { 
        email: "lab@akuh.org", 
        phone: "+254 20 7654321",
        website: "https://hospitals.aku.edu/nairobi",
        address: "3rd Parklands Avenue, Nairobi, Kenya"
      },
      testCapabilities: ["Molecular Diagnostics", "Pathology", "Specialized Tests"],
      accreditations: ["ISO 15189", "College of American Pathologists (CAP)"]
    },
    {
      id: 3,
      facilityName: "Lancet Laboratories Kenya",
      country: "Kenya",
      region: "Multiple",
      facilityType: "Laboratory",
      specializationAreas: ["Biochemistry", "Hematology", "Immunology", "Microbiology"],
      contactInformation: { 
        email: "info.kenya@lancet.co.ke", 
        phone: "+254 20 2861000",
        website: "https://www.lancet.co.ke",
        address: "Multiple locations across Kenya"
      },
      testCapabilities: ["Molecular Diagnostics", "Pathology", "Point-of-Care Testing"],
      accreditations: ["ISO 15189", "South African National Accreditation System (SANAS)"]
    },
    {
      id: 4,
      facilityName: "KEMRI - Kenya Medical Research Institute",
      country: "Kenya",
      region: "Nairobi",
      facilityType: "Research Center",
      specializationAreas: ["Infectious Diseases", "Public Health", "Biotechnology"],
      contactInformation: { 
        email: "director@kemri.org", 
        phone: "+254 20 2722541",
        website: "https://www.kemri.org",
        address: "Mbagathi Road, Nairobi, Kenya"
      },
      testCapabilities: ["Molecular Diagnostics", "Specialized Tests"],
      accreditations: ["ISO 15189", "Good Clinical Laboratory Practice (GCLP)"]
    },
    {
      id: 5,
      facilityName: "Nairobi Hospital",
      country: "Kenya",
      region: "Nairobi",
      facilityType: "Hospital",
      specializationAreas: ["General Medicine", "Surgery", "Pediatrics"],
      contactInformation: { 
        email: "info@nairobihospital.org", 
        phone: "+254 20 2845000",
        website: "https://www.nairobihospital.org",
        address: "Argwings Kodhek Road, Nairobi, Kenya"
      },
      testCapabilities: ["Pathology", "Medical Imaging", "Point-of-Care Testing"],
      accreditations: ["ISO 9001:2015", "Joint Commission International (JCI)"]
    }
  ];

  // Filter facilities with search query and capability filter
  // (In a real implementation, we'd fetch this from the API with these filters)
  const filteredFacilities = exampleFacilities.filter(facility => {
    // Apply search query filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      const matchesSearch = 
        facility.facilityName.toLowerCase().includes(query) ||
        facility.country.toLowerCase().includes(query) ||
        facility.region.toLowerCase().includes(query) ||
        facility.facilityType.toLowerCase().includes(query) ||
        facility.specializationAreas.some(area => area.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Apply country filter
    if (selectedCountry && facility.country !== selectedCountry) {
      return false;
    }
    
    // Apply facility type filter
    if (selectedFacilityType && facility.facilityType !== selectedFacilityType) {
      return false;
    }
    
    // Apply test capabilities filter
    if (selectedCapability && !facility.testCapabilities.includes(selectedCapability)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Intro section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Referral Network</h2>
        <p className="text-gray-300">
          Connect with healthcare facilities across Kenya and Africa for test referrals. Find accredited testing centers, 
          laboratories, and specialized facilities to ensure patients receive appropriate diagnostic services.
        </p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select
          value={selectedCountry || ''}
          onValueChange={(value) => setSelectedCountry(value || null)}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Countries</SelectItem>
            {countryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={selectedFacilityType || ''}
          onValueChange={(value) => setSelectedFacilityType(value || null)}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Facility Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {facilityTypeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={selectedCapability || ''}
          onValueChange={(value) => setSelectedCapability(value || null)}
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Test Capability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Capabilities</SelectItem>
            {testCapabilityOptions.map(option => (
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
            placeholder="Search facilities..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Facility Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facility List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Building className="mr-2 h-5 w-5 text-blue-400" />
            Facility Directory
          </h3>
          
          {filteredFacilities.length === 0 ? (
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h4 className="font-medium">No Facilities Found</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your filters to see more results.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSelectedCountry(null);
                    setSelectedFacilityType(null);
                    setSelectedCapability(null);
                    setLocalSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFacilities.map(facility => (
                <Card 
                  key={facility.id}
                  className={`bg-gray-800 border-gray-700 hover:border-blue-600 cursor-pointer transition-all ${activeFacility === facility.id ? 'border-blue-500' : ''}`}
                  onClick={() => setActiveFacility(facility.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{facility.facilityName}</h4>
                        <div className="flex items-center mt-1 text-gray-400 text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{facility.region}, {facility.country}</span>
                        </div>
                      </div>
                      <Badge 
                        className={facility.facilityType === 'Hospital' ? 'bg-green-600' :
                                  facility.facilityType === 'Laboratory' ? 'bg-blue-600' :
                                  facility.facilityType === 'Research Center' ? 'bg-purple-600' : 'bg-orange-600'}
                      >
                        {facility.facilityType}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap">
                      {facility.testCapabilities.slice(0, 2).map(capability => 
                        getCapabilityBadge(capability)
                      )}
                      {facility.testCapabilities.length > 2 && (
                        <Badge variant="outline" className="bg-gray-700 border-gray-600">
                          +{facility.testCapabilities.length - 2} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="flex items-center text-gray-400">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                        {facility.accreditations.length} accreditations
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Facility Details */}
        <div className="lg:col-span-2">
          {activeFacility ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {filteredFacilities.find(f => f.id === activeFacility)?.facilityName}
                    </CardTitle>
                    <div className="flex items-center mt-1 text-gray-400 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        {filteredFacilities.find(f => f.id === activeFacility)?.contactInformation.address}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    className={
                      filteredFacilities.find(f => f.id === activeFacility)?.facilityType === 'Hospital' ? 'bg-green-600' :
                      filteredFacilities.find(f => f.id === activeFacility)?.facilityType === 'Laboratory' ? 'bg-blue-600' :
                      filteredFacilities.find(f => f.id === activeFacility)?.facilityType === 'Research Center' ? 'bg-purple-600' : 'bg-orange-600'
                    }
                  >
                    {filteredFacilities.find(f => f.id === activeFacility)?.facilityType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-blue-400" />
                      Contact Information
                    </h4>
                    <div className="space-y-2 text-gray-300">
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        {filteredFacilities.find(f => f.id === activeFacility)?.contactInformation.phone}
                      </p>
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {filteredFacilities.find(f => f.id === activeFacility)?.contactInformation.email}
                      </p>
                      <p className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                        <a 
                          href={filteredFacilities.find(f => f.id === activeFacility)?.contactInformation.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Visit Website
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-green-400" />
                      Specialization Areas
                    </h4>
                    <div className="flex flex-wrap">
                      {filteredFacilities.find(f => f.id === activeFacility)?.specializationAreas.map(area => (
                        <Badge key={area} variant="outline" className="bg-gray-700 border-gray-600 mr-2 mb-2">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test Capabilities */}
                <div className="mt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-yellow-400" />
                    Testing Capabilities
                  </h4>
                  <div className="flex flex-wrap mb-4">
                    {filteredFacilities.find(f => f.id === activeFacility)?.testCapabilities.map(capability => 
                      getCapabilityBadge(capability)
                    )}
                  </div>
                </div>

                {/* Accreditations */}
                <div className="mt-6">
                  <h4 className="font-medium mb-2 flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-400" />
                    Accreditations & Certifications
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Accreditation</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFacilities.find(f => f.id === activeFacility)?.accreditations.map(accreditation => (
                        <TableRow key={accreditation}>
                          <TableCell>{accreditation}</TableCell>
                          <TableCell>
                            <span className="flex items-center text-green-400">
                              <CheckCircle className="h-4 w-4 mr-1" /> 
                              Active
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Referral Actions */}
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                  <Button className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Create Referral Request
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Facility
                  </Button>
                  <Button variant="ghost" className="flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700 h-full flex items-center justify-center">
              <CardContent className="p-8 text-center">
                <Building className="mx-auto h-16 w-16 text-gray-700 mb-4" />
                <h3 className="text-xl font-medium text-white">Select a Facility</h3>
                <p className="mt-2 text-gray-400 max-w-md mx-auto">
                  Choose a facility from the list to view detailed information, including contact details,
                  testing capabilities, and accreditations.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Referral Management Resources */}
      <Card className="bg-gray-800 border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="mr-2 h-5 w-5 text-green-400" />
            Referral Management Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium">Standardized Referral Forms</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Download country-specific referral forms approved by respective health ministries.
                </p>
                <Button variant="outline" className="mt-4 w-full">Download Forms</Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium">Result Reporting Templates</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Standardized templates for reporting test results back to referring facilities.
                </p>
                <Button variant="outline" className="mt-4 w-full">Download Templates</Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium">Referral Guidelines</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Best practices and protocols for creating, managing, and tracking patient referrals.
                </p>
                <Button variant="outline" className="mt-4 w-full">View Guidelines</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Capacity Building Resources */}
      <Card className="bg-gray-800 border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Building className="mr-2 h-5 w-5 text-yellow-400" />
            Capacity Building Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Resources to help healthcare facilities improve their testing capabilities and quality assurance systems.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium">Training Materials</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
                    Specimen Collection and Handling for Resource-Limited Settings
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
                    Quality Control for Point-of-Care Testing
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
                    Interpreting Laboratory Results in Clinical Context
                  </li>
                </ul>
                <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300">
                  View All Training Materials
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-700 border-gray-600">
              <CardContent className="p-4">
                <h3 className="font-medium">Quality Assurance Protocols</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
                    Laboratory Quality Management System Implementation Guide
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
                    ISO 15189 Implementation for Small Laboratories
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 mr-1 mt-0.5 text-blue-400" />
                    Equipment Calibration and Maintenance Schedules
                  </li>
                </ul>
                <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300">
                  View All Quality Protocols
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}