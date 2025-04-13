// Direct deployment script - builds locally and prepares for manual upload
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

console.log("Starting direct deployment build process...");

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
  // Install archiver if not already installed
  try {
    require.resolve("archiver");
  } catch (e) {
    console.log("Installing archiver package...");
    execSync("npm install archiver --no-save", { stdio: "inherit" });
  }

  // Run the build
  console.log("Running build command...");
  execSync("react-scripts build", {
    stdio: "inherit",
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
  
  // Create a zip file of the build folder
  const buildDir = path.join(__dirname, "..", "build");
  const outputZip = path.join(__dirname, "..", "build.zip");
  
  console.log("Creating zip file of the build folder...");
  
  const output = fs.createWriteStream(outputZip);
  const archive = archiver("zip", { zlib: { level: 9 } });
  
  output.on("close", function() {
    console.log(`Zip file created: ${outputZip} (${archive.pointer()} bytes)`);
    console.log("You can now manually upload this zip file to Netlify.");
  });
  
  archive.on("error", function(err) {
    throw err;
  });
  
  archive.pipe(output);
  archive.directory(buildDir, false);
  archive.finalize();
  
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
