import { useQuery } from "@tanstack/react-query";
import { RegulatoryDocument, ReferralFacility, Vendor, Product, ProductCode } from "@shared/schema";

// Hook for regulatory documents
export function useRegulatoryDocuments(country?: string, region?: string, documentType?: string) {
  return useQuery<RegulatoryDocument[]>({
    queryKey: ["/api/regulatory-documents", { country, region, documentType }],
    enabled: true,
  });
}

// Hook for referral facilities
export function useReferralFacilities(country?: string, region?: string, facilityType?: string) {
  return useQuery<ReferralFacility[]>({
    queryKey: ["/api/referral-facilities", { country, region, facilityType }],
    enabled: true,
  });
}

// Hook for vendors
export function useVendors(country?: string, region?: string, vendorType?: string) {
  return useQuery<Vendor[]>({
    queryKey: ["/api/vendors", { country, region, vendorType }],
    enabled: true,
  });
}

// Hook for products
export function useProducts(vendorId?: number, category?: string, subCategory?: string) {
  return useQuery<Product[]>({
    queryKey: ["/api/products", { vendorId, category, subCategory }],
    enabled: true,
  });
}

// Hook for product codes
export function useProductCodes(productId: string) {
  return useQuery<ProductCode[]>({
    queryKey: ["/api/product-codes", productId],
    enabled: !!productId,
  });
}

// Hook for a single regulatory document
export function useRegulatoryDocument(id: number) {
  return useQuery<RegulatoryDocument>({
    queryKey: ["/api/regulatory-documents", id],
    enabled: !!id,
  });
}

// Hook for a single referral facility
export function useReferralFacility(id: number) {
  return useQuery<ReferralFacility>({
    queryKey: ["/api/referral-facilities", id],
    enabled: !!id,
  });
}

// Hook for a single vendor
export function useVendor(id: number) {
  return useQuery<Vendor>({
    queryKey: ["/api/vendors", id],
    enabled: !!id,
  });
}

// Hook for a single product
export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["/api/products", id],
    enabled: !!id,
  });
}