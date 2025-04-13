const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Path to the functions directory
const functionsDir = path.join(__dirname, "..", "netlify", "functions");

// Check if the functions directory exists
if (fs.existsSync(functionsDir)) {
  console.log("Installing dependencies for Netlify Functions...");
  
  // Check if package.json exists in the functions directory
  const packageJsonPath = path.join(functionsDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      // Change to the functions directory and install dependencies
      process.chdir(functionsDir);
      execSync("npm install", { stdio: "inherit" });
      console.log("Successfully installed dependencies for Netlify Functions");
      
      // Change back to the original directory
      process.chdir(path.join(__dirname, ".."));
    } catch (error) {
      console.error("Error installing dependencies for Netlify Functions:", error.message);
      process.exit(1);
    }
  } else {
    console.log("No package.json found in the functions directory");
  }
} else {
  console.log("No functions directory found");
}
