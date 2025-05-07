import { Router } from "express";
import { db } from "./db";
import { 
  regulatoryDocuments, 
  referralFacilities, 
  vendors, 
  products, 
  productCodes 
} from "@shared/schema";
import { eq, like, and, isNotNull } from "drizzle-orm";

const router = Router();

// Regulatory Documents routes
router.get("/regulatory-documents", async (req, res) => {
  try {
    const { country, region, documentType } = req.query;
    
    let query = db.select().from(regulatoryDocuments);
    
    // Add filters if provided
    const conditions = [];
    if (country) {
      conditions.push(eq(regulatoryDocuments.country, country as string));
    }
    if (region) {
      conditions.push(eq(regulatoryDocuments.region, region as string));
    }
    if (documentType) {
      conditions.push(eq(regulatoryDocuments.documentType, documentType as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const documents = await query;
    res.json(documents);
  } catch (error) {
    console.error("Error fetching regulatory documents:", error);
    res.status(500).json({ error: "Failed to fetch regulatory documents" });
  }
});

router.get("/regulatory-documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [document] = await db
      .select()
      .from(regulatoryDocuments)
      .where(eq(regulatoryDocuments.id, parseInt(id)));
    
    if (!document) {
      return res.status(404).json({ error: "Regulatory document not found" });
    }
    
    res.json(document);
  } catch (error) {
    console.error("Error fetching regulatory document:", error);
    res.status(500).json({ error: "Failed to fetch regulatory document" });
  }
});

// Referral Facilities routes
router.get("/referral-facilities", async (req, res) => {
  try {
    const { country, region, facilityType } = req.query;
    
    let query = db.select().from(referralFacilities);
    
    // Add filters if provided
    const conditions = [];
    if (country) {
      conditions.push(eq(referralFacilities.country, country as string));
    }
    if (region) {
      conditions.push(eq(referralFacilities.region, region as string));
    }
    if (facilityType) {
      conditions.push(eq(referralFacilities.facilityType, facilityType as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const facilities = await query;
    res.json(facilities);
  } catch (error) {
    console.error("Error fetching referral facilities:", error);
    res.status(500).json({ error: "Failed to fetch referral facilities" });
  }
});

router.get("/referral-facilities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [facility] = await db
      .select()
      .from(referralFacilities)
      .where(eq(referralFacilities.id, parseInt(id)));
    
    if (!facility) {
      return res.status(404).json({ error: "Referral facility not found" });
    }
    
    res.json(facility);
  } catch (error) {
    console.error("Error fetching referral facility:", error);
    res.status(500).json({ error: "Failed to fetch referral facility" });
  }
});

// Vendors routes
router.get("/vendors", async (req, res) => {
  try {
    const { country, region, vendorType } = req.query;
    
    let query = db.select().from(vendors);
    
    // Add filters if provided
    const conditions = [];
    if (country) {
      conditions.push(eq(vendors.country, country as string));
    }
    if (region) {
      conditions.push(eq(vendors.region, region as string));
    }
    if (vendorType) {
      conditions.push(eq(vendors.vendorType, vendorType as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const vendorList = await query;
    res.json(vendorList);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.get("/vendors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, parseInt(id)));
    
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    
    res.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// Products routes
router.get("/products", async (req, res) => {
  try {
    const { vendorId, category, subCategory } = req.query;
    
    let query = db.select().from(products);
    
    // Add filters if provided
    const conditions = [];
    if (vendorId) {
      conditions.push(eq(products.vendorId, parseInt(vendorId as string)));
    }
    if (category) {
      conditions.push(eq(products.category, category as string));
    }
    if (subCategory) {
      conditions.push(eq(products.subCategory, subCategory as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const productList = await query;
    res.json(productList);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Product Codes routes
router.get("/product-codes/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const codes = await db
      .select()
      .from(productCodes)
      .where(eq(productCodes.productId, productId));
    
    res.json(codes);
  } catch (error) {
    console.error("Error fetching product codes:", error);
    res.status(500).json({ error: "Failed to fetch product codes" });
  }
});

export default router;