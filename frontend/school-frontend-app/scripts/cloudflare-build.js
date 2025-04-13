// Cloudflare Pages build script
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Starting Cloudflare Pages build process...");

// Set environment variables for the build
process.env.CI = "true";
process.env.DISABLE_ESLINT_PLUGIN = "true";
process.env.ESLINT_NO_DEV_ERRORS = "true";
process.env.REACT_APP_API_URL = "/api";
process.env.REACT_APP_BACKEND_URL = "https://misty-roby-haizard-17a53e2a.koyeb.app";
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
      REACT_APP_BACKEND_URL: "https://misty-roby-haizard-17a53e2a.koyeb.app",
      GENERATE_SOURCEMAP: "false"
    }
  });
  
  console.log("Build completed successfully!");
  
  // Create _routes.json file for Cloudflare Pages
  console.log("Creating _routes.json for Cloudflare Pages...");
  const routesContent = {
    "version": 1,
    "include": ["/*"],
    "exclude": ["/api/*"],
    "routes": [
      {
        "src": "/api/*",
        "dest": "https://misty-roby-haizard-17a53e2a.koyeb.app/api/:splat"
      },
      {
        "src": "/*",
        "dest": "/index.html"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(__dirname, "..", "build", "_routes.json"), 
    JSON.stringify(routesContent, null, 2)
  );
  
  console.log("_routes.json created successfully!");
  
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
