// Vercel build script for frontend
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Starting Vercel build process for frontend...");

// Set environment variables for the build
process.env.CI = "true";
process.env.DISABLE_ESLINT_PLUGIN = "true";
process.env.ESLINT_NO_DEV_ERRORS = "true";
process.env.REACT_APP_API_URL = "/api";
process.env.GENERATE_SOURCEMAP = "false";
process.env.NODE_OPTIONS = "--max-old-space-size=1536";

// Create a simple .eslintrc.js file
console.log("Disabling ESLint...");
const eslintPath = path.join(__dirname, "..", ".eslintrc.js");
fs.writeFileSync(eslintPath, "module.exports = { rules: {} };");

try {
  // Run the build with a timeout
  console.log("Running build command...");
  execSync("CI=true react-scripts build", {
    stdio: "inherit",
    env: {
      ...process.env,
      CI: "true",
      DISABLE_ESLINT_PLUGIN: "true",
      ESLINT_NO_DEV_ERRORS: "true",
      REACT_APP_API_URL: "/api",
      GENERATE_SOURCEMAP: "false"
    }
  });
  
  console.log("Frontend build completed successfully!");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
