// backend/data.js

// This file now primarily provides:
// 1. The initial structure for featured companies (job counts are dynamic).
// 2. Static lists for filter options (categories, locations, job types).
//
// Actual job data is managed in the MongoDB database.
// If you need to seed the database with initial jobs,
// you should create a separate seeding script.

// Initial structure for featured companies.
// The 'jobs' count for these will be calculated dynamically by the backend
// based on the actual job listings in the database.
const featuredCompanies = [
  {
    id: "fc_webweavers", // A unique identifier for the featured company entry
    name: "Web Weavers Inc.",
    logo: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.8, // Example static rating
    // 'jobs' field will be populated dynamically by the server
  },
  {
    id: "fc_skyhigh",
    name: "SkyHigh Cloud Services",
    logo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.9,
  },
  {
    id: "fc_growthpro",
    name: "GrowthPro Agency",
    logo: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.7,
  },
  {
    id: "fc_innovatex",
    name: "InnovateX Solutions",
    logo: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.6,
  },
  {
    id: "fc_dataflow",
    name: "DataFlow Systems",
    logo: "https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.9,
  },
  {
    id: "fc_agilesprint",
    name: "Agile Sprint Corp",
    logo: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    rating: 4.7,
  }
];

// Job categories for filter dropdowns.
// These are provided to the frontend via the /api/filter-options endpoint.
const jobCategories = [
  "Accounting - Finance",
  "Advertising",
  "Agriculture",
  "Airline - Aviation",
  "Architecture - Building",
  "Art - Photography - Journalism",
  "Automotive - Motor Vehicles - Parts",
  "Banking - Financial Services",
  "Biotechnology",
  "Broadcasting - Radio - TV",
  "Building Materials",
  "Chemical",
  "Computer Hardware",
  "Computer Software",
  "Construction",
  "Consulting",
  "Consumer Products",
  "Credit - Loan - Collections",
  "Defense - Aerospace",
  "Education - Teaching - Administration",
  "Electronics",
  "Employment - Recruiting - Staffing",
  "Energy - Utilities - Gas - Electric",
  "Entertainment",
  "Environmental",
  "Exercise - Fitness",
  "Fashion - Apparel - Textile",
  "Food",
  "Funeral - Cemetery",
  "Government - Civil Service",
  "Healthcare - Health Services",
  "Homebuilding",
  "Hospitality",
  "Hotel - Resort",
  "HVAC",
  "Import - Export",
  "Industrial",
  "Insurance",
  "Internet - ECommerce",
  "Landscaping",
  "Law Enforcement",
  "Legal",
  "Library Science",
  "Managed Care",
  "Manufacturing",
  "Medical Equipment",
  "Merchandising",
  "Military",
  "Mortgage",
  "Newspaper",
  "Not for Profit - Charitable",
  "Office Supplies - Equipment",
  "Oil Refining - Petroleum - Drilling",
  "Other Great Industries",
  "Packaging",
  "Pharmaceutical",
  "Printing - Publishing",
  "Public Relations",
  "Real Estate - Property Mgt",
  "Recreation",
  "Restaurant",
  "Retail",
  "Sales - Marketing",
  "Securities",
  "Security",
  "Semiconductor",
  "Social Services",
  "Telecommunications",
  "Training",
  "Transportation",
  "Travel",
  "Wireless",
  "IT Software",
  "Hardware",
];

// Locations for filter dropdowns.
const locations = [
  "All India",
  "Agra",
  "Ahmedabad",
  "Amritsar",
  "Aurangabad",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Dehradun",
  "Delhi",
  "Faridabad",
  "Ghaziabad",
  "Guwahati",
  "Gurugram",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Jamshedpur",
  "Jodhpur",
  "Kanpur",
  "Kochi",
  "Kolkata",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Mangaluru",
  "Mumbai",
  "Mysuru",
  "Nagpur",
  "Nashik",
  "Noida",
  "Panaji",
  "Patna",
  "Puducherry",
  "Pune",
  "Raipur",
  "Rajkot",
  "Ranchi",
  "Surat",
  "Thane",
  "Thiruvananthapuram",
  "Udaipur",
  "Vadodara",
  "Varanasi",
  "Vijayawada",
  "Visakhapatnam",
  "Remote"
];

// Job types for filter dropdowns.
const jobTypes = [
    // "All Types", // Usually the first option
    "In Office",
    "Remote",
    "Hybrid"
];

module.exports = {
  featuredCompanies, // This is used as 'initialFeaturedCompaniesSeed' in controllers/server
  jobCategories,
  locations,
  jobTypes
};
