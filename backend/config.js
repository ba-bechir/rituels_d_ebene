import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

const config = {
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:3001",
  env: process.env.REACT_APP_ENV,
  siteName: process.env.REACT_APP_SITE_NAME,
  //analyticsId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID
};

dotenv.config({ path: `${__dirname}/${envFile}` });

export default config;
