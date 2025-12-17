import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSampleData, addSampleContent } from "./lib/sampleData";
import { storage } from "./lib/storage";

// Initialize sample data on app load
initializeSampleData();

// Add sample content (blogs, issues) if they don't exist
addSampleContent();

// Migrate old date fields
storage.migrateDateFields();

createRoot(document.getElementById("root")!).render(<App />);
