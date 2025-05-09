import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { dbStorage } from "../storage-db";

const scryptAsync = promisify(scrypt);

// Function to hash a password
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to create the default admin user
export async function createDefaultAdmin() {
  try {
    // Check if the admin user already exists
    const existingUser = await dbStorage.getUserByUsername("doctor1");
    
    if (!existingUser) {
      console.log("Creating default admin user: doctor1");
      const hashedPassword = await hashPassword("medirefs2025#!");
      await dbStorage.createUser({
        username: "doctor1",
        password: hashedPassword
      });
      console.log("✅ Default admin user created successfully");
    } else {
      console.log("✅ Default admin user already exists");
    }
  } catch (error) {
    console.error("Failed to create default admin user:", error);
  }
}