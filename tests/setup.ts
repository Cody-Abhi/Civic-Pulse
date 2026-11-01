import "@testing-library/jest-dom";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.ANALYSIS_TOKEN_SECRET) {
  process.env.ANALYSIS_TOKEN_SECRET = "22b31d5fc8c1fcaec9da44c5410cbd5c96050968d6a7e710f8f2bb59f588e62e";
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = "test-gemini-key";
}
