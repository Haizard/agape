// Static build script for Netlify
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Starting static build process...");

// Set environment variables for the build
process.env.CI = "true";
process.env.DISABLE_ESLINT_PLUGIN = "true";
process.env.ESLINT_NO_DEV_ERRORS = "true";
process.env.REACT_APP_API_URL = "/api";
process.env.REACT_APP_USE_STATIC_MODE = "true";
process.env.GENERATE_SOURCEMAP = "false";
process.env.NODE_OPTIONS = "--max-old-space-size=1536";

// Create a simple .eslintrc.js file
console.log("Disabling ESLint...");
const eslintPath = path.join(__dirname, "..", ".eslintrc.js");
fs.writeFileSync(eslintPath, "module.exports = { rules: {} };");

try {
  // Run the build with a timeout
  console.log("Running build command with 15 minute timeout...");
  execSync("react-scripts build", {
    stdio: "inherit",
    timeout: 15 * 60 * 1000, // 15 minute timeout
    env: {
      ...process.env,
      CI: "true",
      DISABLE_ESLINT_PLUGIN: "true",
      ESLINT_NO_DEV_ERRORS: "true",
      REACT_APP_API_URL: "/api",
      REACT_APP_USE_STATIC_MODE: "true",
      GENERATE_SOURCEMAP: "false"
    }
  });
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed or timed out:", error.message);
  process.exit(1);
}
