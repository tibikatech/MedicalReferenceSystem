import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableCell, 
  TableHead 
} from '@/components/ui/table';
import { useVendors, useProducts, useProductCodes } from '@/hooks/useLegalData';
import { 
  Search, 
  ShoppingCart, 
  Building, 
  Code, 
  Tag, 
  MapPin, 
  ArrowRight, 
  Box, 
  DollarSign, 
  Globe, 
  FileText, 
  AlertCircle,
  Check,
  X
} from 'lucide-react';

interface VendorMarketplaceProps {
  searchQuery?: string;
}

// Category options for products
const productCategoryOptions = [
  { value: 'Laboratory Equipment', label: 'Laboratory Equipment' },
  { value: 'Diagnostic Devices', label: 'Diagnostic Devices' },
  { value: 'Consumables', label: 'Consumables' },
  { value: 'Reagents', label: 'Reagents' },
  { value: 'Point-of-Care Testing', label: 'Point-of-Care Testing' },
  { value: 'Medical Imaging', label: 'Medical Imaging' },
];

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

// Vendor type options
const vendorTypeOptions = [
  { value: 'Manufacturer', label: 'Manufacturer' },
  { value: 'Distributor', label: 'Distributor' },
  { value: 'Service Provider', label: 'Service Provider' },
];

// Example vendor data (would be replaced with API data)
const exampleVendors = [
  {
    id: 1,
    vendorName: "Kenya Laboratory Supplies Ltd",
    country: "Kenya",
    region: "Nairobi",
    vendorType: "Distributor",
    productCategories: ["Laboratory Equipment", "Reagents", "Consumables"],
    contactInformation: {
      email: "info@kenlab.co.ke",
      phone: "+254 20 1234567",
      website: "https://kenlab.co.ke",
      address: "Industrial Area, Nairobi, Kenya"
    },
    certifications: ["ISO 9001:2015", "Kenya Bureau of Standards Certified"],
    servicesOffered: ["Equipment Installation", "Maintenance", "Training"]
  },
  {
    id: 2,
    vendorName: "AfriMed Diagnostics",
    country: "Kenya",
    region: "Mombasa",
    vendorType: "Manufacturer",
    productCategories: ["Diagnostic Devices", "Point-of-Care Testing", "Reagents"],
    contactInformation: {
      email: "sales@afrimed.com",
      phone: "+254 41 5678901",
      website: "https://afrimed.com",
      address: "Mombasa Road, Mombasa, Kenya"
    },
    certifications: ["ISO 13485", "CE Mark", "USFDA Approved"],
    servicesOffered: ["Product Development", "Manufacturing", "Quality Assurance"]
  },
  {
    id: 3,
    vendorName: "East Africa Medical Supplies",
    country: "Tanzania",
    region: "Dar es Salaam",
    vendorType: "Distributor",
    productCategories: ["Medical Imaging", "Laboratory Equipment", "Consumables"],
    contactInformation: {
      email: "contact@eams.co.tz",
      phone: "+255 22 1122334",
      website: "https://eams.co.tz",
      address: "Nyerere Road, Dar es Salaam, Tanzania"
    },
    certifications: ["Tanzania Bureau of Standards Certified", "ISO 9001:2015"],
    servicesOffered: ["Distribution", "Technical Support", "Logistics"]
  },
  {
    id: 4,
    vendorName: "HealthTech Services",
    country: "Kenya",
    region: "Nairobi",
    vendorType: "Service Provider",
    productCategories: ["Laboratory Equipment", "Medical Imaging", "Diagnostic Devices"],
    contactInformation: {
      email: "service@healthtech.co.ke",
      phone: "+254 20 9876543",
      website: "https://healthtech.co.ke",
      address: "Westlands, Nairobi, Kenya"
    },
    certifications: ["ISO 17025", "Authorized Service Provider"],
    servicesOffered: ["Calibration", "Maintenance", "Repair", "Validation"]
  },
  {
    id: 5,
    vendorName: "NeoLab Science Technologies",
    country: "Kenya",
    region: "Nairobi",
    vendorType: "Manufacturer",
    productCategories: ["Laboratory Equipment", "Reagents", "Point-of-Care Testing"],
    contactInformation: {
      email: "info@neolab.co.ke",
      phone: "+254 20 5556677",
      website: "https://neolab.co.ke",
      address: "Karen, Nairobi, Kenya"
    },
    certifications: ["ISO 13485", "Kenya Bureau of Standards Certified", "WHO Prequalified"],
    servicesOffered: ["Manufacturing", "Research & Development", "Training"]
  }
];

// Example product data
const exampleProducts = [
  {
    id: "PRD-1001",
    vendorId: 2,
    name: "AfriTest Malaria RDT Kit",
    category: "Diagnostic Devices",
    subCategory: "Rapid Diagnostic Tests",
    description: "Point-of-care rapid diagnostic test kit for malaria detection, specifically optimized for P. falciparum and P. vivax strains common in East Africa. Each kit contains 25 tests.",
    specifications: {
      sensitivity: "95%",
      specificity: "98%",
      shelfLife: "24 months",
      storageConditions: "2-30°C",
      testTime: "15-20 minutes",
      sampleType: "Whole blood",
      packageContents: "25 test cassettes, buffer solution, lancets, alcohol swabs, instructions"
    },
    regulatoryApprovals: ["WHO Prequalified", "Kenya Pharmacy and Poisons Board", "CE Mark"],
    availableCountries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"],
    price: {
      currency: "KES",
      amount: 6500,
      per: "kit of 25 tests"
    }
  },
  {
    id: "PRD-1002",
    vendorId: 5,
    name: "NeoSpect Portable Spectrophotometer",
    category: "Laboratory Equipment",
    subCategory: "Spectrophotometers",
    description: "Compact, battery-operated spectrophotometer designed for field use in resource-limited settings. Features pre-programmed assays for common tests and can operate without continuous power supply.",
    specifications: {
      wavelengthRange: "340-800 nm",
      accuracy: "±1 nm",
      batteryLife: "8 hours continuous use",
      memory: "1000 test results",
      connectivity: "USB, Bluetooth",
      weight: "1.2 kg",
      dimensions: "22 x 15 x 8 cm"
    },
    regulatoryApprovals: ["Kenya Bureau of Standards", "ISO 13485", "CE Mark"],
    availableCountries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi", "Ethiopia", "South Sudan"],
    price: {
      currency: "USD",
      amount: 1200,
      per: "unit"
    }
  },
  {
    id: "PRD-1003",
    vendorId: 1,
    name: "SafeVac Blood Collection Tubes",
    category: "Consumables",
    subCategory: "Blood Collection",
    description: "Vacuum blood collection tubes manufactured with tropical conditions in mind. Features enhanced stability in high-temperature environments and safety-engineered design to prevent accidental needlesticks.",
    specifications: {
      types: "EDTA, Serum, Heparin, Glucose",
      volumes: "2ml, 4ml, 6ml",
      packaging: "100 tubes per box",
      shelfLife: "36 months",
      specialFeatures: "Temperature-stable, Safety-engineered caps"
    },
    regulatoryApprovals: ["Kenya Bureau of Standards", "ISO 13485", "FDA 510k"],
    availableCountries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Burundi", "Ethiopia", "Nigeria", "Ghana"],
    price: {
      currency: "KES",
      amount: 4500,
      per: "box of 100"
    }
  },
  {
    id: "PRD-1004",
    vendorId: 2,
    name: "AfriTest HIV Combo Test",
    category: "Diagnostic Devices",
    subCategory: "Rapid Diagnostic Tests",
    description: "Combined antibody/antigen rapid test for HIV screening, optimized for HIV-1 subtypes circulating in Africa. Provides results in 15 minutes with high sensitivity for early detection.",
    specifications: {
      sensitivity: "99.5%",
      specificity: "99.8%",
      windowPeriod: "14-21 days",
      sampleTypes: "Whole blood, serum, plasma",
      testTime: "15 minutes",
      storage: "2-30°C"
    },
    regulatoryApprovals: ["WHO Prequalified", "Kenya Pharmacy and Poisons Board", "PEPFAR Approved", "CE Mark"],
    availableCountries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia", "Nigeria", "South Africa"],
    price: {
      currency: "KES",
      amount: 9000,
      per: "kit of 50 tests"
    }
  },
  {
    id: "PRD-1005",
    vendorId: 3,
    name: "DiagImage Portable X-Ray Unit",
    category: "Medical Imaging",
    subCategory: "X-Ray Equipment",
    description: "Lightweight, transportable X-ray unit designed for use in rural and resource-limited settings. Features battery operation, reduced radiation exposure, and digital image capture compatible with standard tablets and laptops.",
    specifications: {
      power: "Battery-operated, 6-8 hours per charge",
      exposureRange: "40-110 kV, 0.4-100 mAs",
      weight: "25 kg",
      digitalDetector: "Wireless flat panel DR detector",
      connectivity: "WiFi, USB",
      radiation: "Reduced dose technology"
    },
    regulatoryApprovals: ["Kenya Radiation Protection Board", "Tanzania Atomic Energy Commission", "CE Mark", "FDA 510k"],
    availableCountries: ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ethiopia"],
    price: {
      currency: "USD",
      amount: 18500,
      per: "unit"
    }
  }
];

// Example product codes
const exampleProductCodes = {
  "PRD-1001": [
    { codeSystem: "UN-SPSC", code: "42181536", description: "Blood test kits or supplies" },
    { codeSystem: "EU-MDR", code: "B.90.1.1.3", description: "In vitro diagnostic for infectious disease" },
    { codeSystem: "US-FDA", code: "PSH", description: "Malaria antigen detection reagents" },
    { codeSystem: "China-NMPA", code: "6840-1", description: "Immunodiagnostic reagent" },
    { codeSystem: "Kenya-KEBS", code: "KS 2716", description: "Medical diagnostic devices" }
  ],
  "PRD-1002": [
    { codeSystem: "UN-SPSC", code: "41115406", description: "Spectrophotometers" },
    { codeSystem: "EU-MDR", code: "Z.12.3.2", description: "Measurement device for in vitro diagnostic" },
    { codeSystem: "US-FDA", code: "JQP", description: "Photometer For Clinical Use" },
    { codeSystem: "China-NMPA", code: "6841-3", description: "Medical analysis instrument" },
    { codeSystem: "Kenya-KEBS", code: "KS 2453", description: "Laboratory equipment" }
  ],
  "PRD-1003": [
    { codeSystem: "UN-SPSC", code: "41104107", description: "Vacuum blood collection tubes or containers" },
    { codeSystem: "EU-MDR", code: "B.02.1.1", description: "Non-active sample collection device" },
    { codeSystem: "US-FDA", code: "GIM", description: "Container, Vacuum Blood Collection" },
    { codeSystem: "China-NMPA", code: "6866-1", description: "Medical consumable" },
    { codeSystem: "Kenya-KEBS", code: "KS 2598", description: "Medical consumables" }
  ],
  "PRD-1004": [
    { codeSystem: "UN-SPSC", code: "42181502", description: "HIV test kits" },
    { codeSystem: "EU-MDR", code: "B.90.1.1.2", description: "HIV diagnostic device" },
    { codeSystem: "US-FDA", code: "MZF", description: "HIV Serological Reagent" },
    { codeSystem: "China-NMPA", code: "6840-3", description: "Virus detection reagent" },
    { codeSystem: "Kenya-KEBS", code: "KS 2832", description: "HIV diagnostic test kit" }
  ],
  "PRD-1005": [
    { codeSystem: "UN-SPSC", code: "42201804", description: "Medical x ray units" },
    { codeSystem: "EU-MDR", code: "C.06.1.2", description: "X-ray diagnostic equipment" },
    { codeSystem: "US-FDA", code: "KPR", description: "Stationary X-Ray System" },
    { codeSystem: "China-NMPA", code: "6830-2", description: "X-ray equipment" },
    { codeSystem: "Kenya-KEBS", code: "KS 2601", description: "Medical imaging device" }
  ]
};

export default function VendorMarketplace({ searchQuery = '' }: VendorMarketplaceProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedVendorType, setSelectedVendorType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('products');
  
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  
  // In a real app, we'd use these instead of the examples:
  // const { data: vendors, isLoading: vendorsLoading } = useVendors(
  //   selectedCountry || undefined,
  //   undefined,
  //   selectedVendorType || undefined
  // );
  
  // const { data: products, isLoading: productsLoading } = useProducts(
  //   selectedVendor || undefined,
  //   selectedCategory || undefined,
  //   undefined
  // );
  
  // const { data: productCodes, isLoading: productCodesLoading } = useProductCodes(
  //   selectedProduct || ""
  // );
  
  // Filter vendors with search query
  const filteredVendors = exampleVendors.filter(vendor => {
    // Apply search query filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      const matchesSearch = 
        vendor.vendorName.toLowerCase().includes(query) ||
        vendor.country.toLowerCase().includes(query) ||
        vendor.region.toLowerCase().includes(query) ||
        vendor.vendorType.toLowerCase().includes(query) ||
        vendor.productCategories.some(category => category.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Apply country filter
    if (selectedCountry && vendor.country !== selectedCountry) {
      return false;
    }
    
    // Apply vendor type filter
    if (selectedVendorType && vendor.vendorType !== selectedVendorType) {
      return false;
    }
    
    return true;
  });
  
  // Filter products with search query and category
  const filteredProducts = exampleProducts.filter(product => {
    // Apply search query filter
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.subCategory && product.subCategory.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Apply vendor filter
    if (selectedVendor && product.vendorId !== selectedVendor) {
      return false;
    }
    
    // Apply category filter
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }
    
    // Apply country filter (if checking availability)
    if (selectedCountry && !product.availableCountries.includes(selectedCountry)) {
      return false;
    }
    
    return true;
  });
  
  // Get product codes for selected product
  const productCodesForSelected = selectedProduct ? exampleProductCodes[selectedProduct as keyof typeof exampleProductCodes] : null;

  return (
    <div className="space-y-6">
      {/* Intro section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Vendor Marketplace</h2>
        <p className="text-gray-300">
          Find medical testing products and equipment from vendors across Kenya and Africa. All products include standardized codes
          such as UN SPSC, EU MDR, US FDA, and regional product codes to facilitate procurement and regulatory compliance.
        </p>
      </div>
      
      {/* Tabs for Products/Vendors */}
      <Tabs 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Vendors
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          {/* Product filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select
              value={selectedCategory || ''}
              onValueChange={(value) => setSelectedCategory(value || null)}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Product Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {productCategoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedVendor ? selectedVendor.toString() : ''}
              onValueChange={(value) => setSelectedVendor(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Vendors</SelectItem>
                {exampleVendors.map(vendor => (
                  <SelectItem key={vendor.id.toString()} value={vendor.id.toString()}>
                    {vendor.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedCountry || ''}
              onValueChange={(value) => setSelectedCountry(value || null)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Available In" />
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
            
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search products..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Product grid/selected product detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product grid */}
            <div className={`space-y-4 ${selectedProduct ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id}
                    className={`bg-gray-800 border-gray-700 hover:border-blue-600 cursor-pointer transition-all ${selectedProduct === product.id ? 'border-blue-500' : ''}`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <Badge className={
                          product.category === 'Laboratory Equipment' ? 'bg-blue-600' :
                          product.category === 'Diagnostic Devices' ? 'bg-green-600' :
                          product.category === 'Consumables' ? 'bg-yellow-600' :
                          product.category === 'Reagents' ? 'bg-purple-600' :
                          product.category === 'Medical Imaging' ? 'bg-red-600' : 'bg-gray-600'
                        }>
                          {product.category}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-700 border-gray-600">
                          {exampleVendors.find(v => v.id === product.vendorId)?.vendorType}
                        </Badge>
                      </div>
                      <h3 className="font-medium mt-3">{product.name}</h3>
                      <div className="flex items-center mt-1 text-gray-400 text-sm">
                        <Building className="h-3 w-3 mr-1" />
                        <span>{exampleVendors.find(v => v.id === product.vendorId)?.vendorName}</span>
                      </div>
                      <p className="mt-2 text-gray-300 text-sm line-clamp-2">
                        {product.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center text-white">
                          <DollarSign className="h-3 w-3 mr-1" />
                          <span>
                            {product.price.currency} {product.price.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Globe className="h-3 w-3 mr-1" />
                          <span>{product.availableCountries.length} countries</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                      <ShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white">No Products Found</h3>
                    <p className="mt-2 text-gray-400 max-w-md mx-auto">
                      {(selectedCategory || selectedVendor || selectedCountry || localSearchQuery) ?
                        "No products match your current filters. Try adjusting your search criteria." :
                        "There are no products available yet. Please check back later."}
                    </p>
                    {(selectedCategory || selectedVendor || selectedCountry || localSearchQuery) && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedVendor(null);
                          setSelectedCountry(null);
                          setLocalSearchQuery('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Product detail */}
            {selectedProduct && (
              <div className="lg:col-span-2 space-y-5">
                {filteredProducts.filter(p => p.id === selectedProduct).map(product => (
                  <div key={product.id} className="space-y-5">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{product.name}</CardTitle>
                            <div className="flex items-center mt-1 text-gray-400">
                              <Building className="h-4 w-4 mr-1" />
                              <span>{exampleVendors.find(v => v.id === product.vendorId)?.vendorName}</span>
                            </div>
                          </div>
                          <Badge className={
                            product.category === 'Laboratory Equipment' ? 'bg-blue-600' :
                            product.category === 'Diagnostic Devices' ? 'bg-green-600' :
                            product.category === 'Consumables' ? 'bg-yellow-600' :
                            product.category === 'Reagents' ? 'bg-purple-600' :
                            product.category === 'Medical Imaging' ? 'bg-red-600' : 'bg-gray-600'
                          }>
                            {product.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4">
                          {product.description}
                        </p>
                        
                        {/* Specifications */}
                        <h4 className="font-medium mb-2 flex items-center">
                          <Tag className="mr-2 h-4 w-4 text-blue-400" />
                          Specifications
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                          {Object.entries(product.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-gray-700 py-1">
                              <span className="text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-gray-200">{value}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Availability */}
                        <h4 className="font-medium mb-2 flex items-center">
                          <Globe className="mr-2 h-4 w-4 text-green-400" />
                          Available Countries
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {product.availableCountries.map(country => (
                            <Badge key={country} variant="outline" className="bg-gray-700 border-gray-600">
                              {country}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Regulatory Approvals */}
                        <h4 className="font-medium mb-2 flex items-center">
                          <Check className="mr-2 h-4 w-4 text-yellow-400" />
                          Regulatory Approvals
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {product.regulatoryApprovals.map(approval => (
                            <Badge key={approval} variant="outline" className="bg-green-900 bg-opacity-30 border-green-700 text-green-300">
                              {approval}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Price */}
                        <h4 className="font-medium mb-2 flex items-center">
                          <DollarSign className="mr-2 h-4 w-4 text-purple-400" />
                          Pricing Information
                        </h4>
                        
                        <div className="bg-gray-700 p-4 rounded-md mb-6">
                          <div className="flex items-baseline">
                            <span className="text-2xl font-semibold">{product.price.currency} {product.price.amount.toLocaleString()}</span>
                            <span className="text-gray-400 ml-2">per {product.price.per}</span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            Contact vendor for volume pricing, shipping costs, and any applicable taxes.
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row gap-3">
                        <Button className="flex items-center">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Request Quote
                        </Button>
                        <Button variant="outline" className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          Download Datasheet
                        </Button>
                        <Button variant="ghost" className="flex items-center ml-auto">
                          Contact Vendor
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Product Codes */}
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Code className="mr-2 h-5 w-5 text-blue-400" />
                          Product Codes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4">
                          Standardized product codes for regulatory compliance, procurement, and international classification.
                        </p>
                        
                        <Table className="border-collapse">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code System</TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead className="hidden md:table-cell">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productCodesForSelected?.map(codeInfo => (
                              <TableRow key={codeInfo.codeSystem + codeInfo.code}>
                                <TableCell className="font-medium">{codeInfo.codeSystem}</TableCell>
                                <TableCell>{codeInfo.code}</TableCell>
                                <TableCell className="hidden md:table-cell">{codeInfo.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="vendors" className="mt-6">
          {/* Vendor filters */}
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
              value={selectedVendorType || ''}
              onValueChange={(value) => setSelectedVendorType(value || null)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Vendor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {vendorTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedCategory || ''}
              onValueChange={(value) => setSelectedCategory(value || null)}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Product Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {productCategoryOptions.map(option => (
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
                placeholder="Search vendors..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Vendor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <Card key={vendor.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <Badge className={
                      vendor.vendorType === 'Manufacturer' ? 'bg-green-600' :
                      vendor.vendorType === 'Distributor' ? 'bg-blue-600' :
                      'bg-purple-600'
                    }>
                      {vendor.vendorType}
                    </Badge>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="text-gray-300">{vendor.region}, {vendor.country}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold">{vendor.vendorName}</h3>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Product Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {vendor.productCategories.map(category => (
                        <Badge key={category} variant="outline" className="bg-gray-700 border-gray-600">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Services Offered</h4>
                    <div className="flex flex-wrap gap-2">
                      {vendor.servicesOffered.slice(0, 2).map(service => (
                        <Badge key={service} variant="outline" className="bg-gray-700 border-gray-600">
                          {service}
                        </Badge>
                      ))}
                      {vendor.servicesOffered.length > 2 && (
                        <Badge variant="outline" className="bg-gray-700 border-gray-600">
                          +{vendor.servicesOffered.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {vendor.certifications.map(cert => (
                        <Badge key={cert} variant="outline" className="bg-green-900 bg-opacity-30 border-green-700 text-green-300">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <a 
                      href={vendor.contactInformation.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                    >
                      Visit Website <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedVendor(vendor.id);
                        setSelectedTab('products');
                      }}
                    >
                      View Products
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredVendors.length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-white">No Vendors Found</h3>
                <p className="mt-2 text-gray-400 max-w-md mx-auto">
                  {(selectedCountry || selectedVendorType || selectedCategory || localSearchQuery) ?
                    "No vendors match your current filters. Try adjusting your search criteria." :
                    "There are no vendors available yet. Please check back later."}
                </p>
                {(selectedCountry || selectedVendorType || selectedCategory || localSearchQuery) && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSelectedCountry(null);
                      setSelectedVendorType(null);
                      setSelectedCategory(null);
                      setLocalSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Procurement Resources */}
      <Card className="bg-gray-800 border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="mr-2 h-5 w-5 text-yellow-400" />
            Procurement Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Tools and documentation to simplify the procurement process for medical testing products in African markets.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-green-400" />
                  Bulk Purchase Guidelines
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Instructions for coordinating bulk purchases to reduce costs and streamline procurement.
                  Includes templates for group purchasing organizations in Kenya and East Africa.
                </p>
                <Button className="mt-2">Download Guidelines</Button>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-blue-400" />
                  Import/Export Requirements by Country
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Country-specific documentation requirements for importing medical products,
                  including customs procedures, duties, and regulatory approvals.
                </p>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {countryOptions.slice(0, 6).map(country => (
                    <Button key={country.value} variant="outline" size="sm" className="w-full justify-start">
                      {country.label} <ArrowRight className="ml-auto h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <Box className="mr-2 h-4 w-4 text-purple-400" />
                  Transportation & Storage Guidelines
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Requirements for transporting and storing different product types,
                  with special consideration for Africa's climate and infrastructure challenges.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center">
                    <Badge className="bg-blue-600 mr-2">Laboratory Equipment</Badge>
                    <Button variant="link" className="h-auto p-0 text-blue-400">View Guidelines</Button>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-green-600 mr-2">Diagnostic Devices</Badge>
                    <Button variant="link" className="h-auto p-0 text-blue-400">View Guidelines</Button>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-yellow-600 mr-2">Consumables</Badge>
                    <Button variant="link" className="h-auto p-0 text-blue-400">View Guidelines</Button>
                  </div>
                  <div className="flex items-center">
                    <Badge className="bg-purple-600 mr-2">Reagents</Badge>
                    <Button variant="link" className="h-auto p-0 text-blue-400">View Guidelines</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="hover:text-blue-400">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-red-400" />
                  Quality Verification Protocols
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                <p className="mb-2">
                  Procedures for verifying product quality and authenticity,
                  including how to check for counterfeit products.
                </p>
                <Button className="mt-2">Download Protocols</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* Supply Chain Resources */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Globe className="mr-2 h-5 w-5 text-blue-400" />
          Africa Medical Supply Chain Resources
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h4 className="font-medium">Africa Medical Supplies Platform</h4>
              <p className="text-sm text-gray-300 mt-1">
                AU-backed platform for pooled procurement of medical supplies across Africa.
              </p>
              <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                Visit Platform <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h4 className="font-medium">Kenya Medical Supplies Authority</h4>
              <p className="text-sm text-gray-300 mt-1">
                Kenya's state corporation for procurement, warehousing and distribution of medical supplies.
              </p>
              <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                Visit KEMSA <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <h4 className="font-medium">East African Community Joint Procurement</h4>
              <p className="text-sm text-gray-300 mt-1">
                Regional pooled procurement initiative for East African Community member states.
              </p>
              <Button variant="link" className="mt-2 px-0 text-blue-400 hover:text-blue-300 flex items-center">
                Learn More <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}