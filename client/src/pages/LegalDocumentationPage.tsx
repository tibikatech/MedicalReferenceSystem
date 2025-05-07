import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegulatoryFramework from "@/components/legal/RegulatoryFramework";
import TestDocumentation from "@/components/legal/TestDocumentation";
import ReferralNetwork from "@/components/legal/ReferralNetwork";
import VendorMarketplace from "@/components/legal/VendorMarketplace";
import { 
  Book, 
  FileText, 
  Building, 
  ShoppingCart,
  GlobeAfrica
} from "lucide-react";

export default function LegalDocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("regulatory");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      <Header onSearch={handleSearch} />
      
      <main className="flex-grow bg-gray-900 text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <FileText className="mr-2 h-6 w-6" />
              Legal & Documentation
            </h1>
            <p className="mt-2 text-gray-400">
              Comprehensive resources focused on Kenya and Africa - regulatory frameworks, 
              medical test documentation, referral networks, and vendor marketplace.
            </p>
          </div>

          {/* Map of Africa banner */}
          <div className="w-full bg-gray-800 bg-opacity-50 p-8 rounded-lg mb-8 flex items-center justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold flex items-center">
                <GlobeAfrica className="mr-2 h-5 w-5 text-blue-400" />
                Africa-Focused Healthcare Resources
              </h2>
              <p className="mt-2 text-gray-300">
                Our platform provides specialized documentation and resources tailored to
                healthcare providers operating across Africa, with particular focus on Kenya
                and East African Community countries. Access regional regulatory information,
                test protocols, and product specifications relevant to African healthcare systems.
              </p>
            </div>
            <div className="hidden md:block">
              {/* This would be a stylized map of Africa, using a placeholder for now */}
              <div className="w-64 h-64 bg-blue-900 bg-opacity-20 rounded-full flex items-center justify-center">
                <GlobeAfrica className="h-40 w-40 text-blue-400 opacity-60" />
              </div>
            </div>
          </div>

          {/* Tabs for different sections */}
          <Tabs 
            defaultValue="regulatory" 
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="mt-6"
          >
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="regulatory" className="flex items-center gap-2">
                <Book className="h-4 w-4" /> 
                Regulatory Framework
              </TabsTrigger>
              <TabsTrigger value="test-docs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> 
                Test Documentation
              </TabsTrigger>
              <TabsTrigger value="referral" className="flex items-center gap-2">
                <Building className="h-4 w-4" /> 
                Referral Network
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> 
                Vendor Marketplace
              </TabsTrigger>
            </TabsList>

            <TabsContent value="regulatory">
              <RegulatoryFramework searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="test-docs">
              <TestDocumentation searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="referral">
              <ReferralNetwork searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="marketplace">
              <VendorMarketplace searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </>
  );
}