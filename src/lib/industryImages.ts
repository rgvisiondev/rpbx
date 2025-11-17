export const INDUSTRY_SLUGS: Record<string, string> = {
  "Agriculture, Forestry, Fishing & Hunting": "agriculture",
  "Mining, Quarrying, & Oil & Gas Extraction": "mining",
  "Utilities": "utilities",
  "Construction": "construction",
  "Manufacturing": "manufacturing",
  "Wholesale Trade": "wholesale-trade",
  "Retail Trade": "retail-trade",
  "Transportation & Warehousing": "transportation",
  "Information": "information",
  "Media, Communications & Publishing": "media",
  "Finance & Insurance": "finance-insurance",
  "Real Estate & Rental & Leasing": "real-estate",
  "Professional, Scientific & Technical Services": "professional-services",
  "Management of Companies & Enterprises": "management",
  "Administrative & Support & Waste Management": "admin-support-waste",
  "Educational Services": "education",
  "Health Care & Social Assistance": "healthcare",
  "Arts, Entertainment & Recreation": "arts-entertainment",
  "Accommodation & Food Services": "accommodation-food",
  "Other Services (except Public Administration)": "other-services",
  "Public Administration": "public-admin",
};

export const INDUSTRY_IMAGES: Record<string, string[]> = {
  agriculture: [
    "agriculture/1.png","agriculture/2.png","agriculture/3.png","agriculture/4.png","agriculture/5.png","agriculture/6.png",
  ],
  mining: ["mining/1.png","mining/2.png","mining/3.png","mining/4.png","mining/5.png","mining/6.png"],
  utilities: ["utilities/1.png","utilities/2.png","utilities/3.png","utilities/4.png","utilities/5.png","utilities/6.png"],
  construction: ["construction/1.png","construction/2.png","construction/3.png","construction/4.png","construction/5.png","construction/6.png"],
  manufacturing: ["manufacturing/1.png","manufacturing/2.png","manufacturing/3.png","manufacturing/4.png","manufacturing/5.png","manufacturing/6.png"],
  "wholesale-trade": ["wholesale-trade/1.png","wholesale-trade/2.png","wholesale-trade/3.png","wholesale-trade/4.png"],
  "retail-trade": ["retail-trade/1.png","retail-trade/2.png","retail-trade/3.png","retail-trade/4.png","retail-trade/5.png","retail-trade/6.png"],
  transportation: ["transportation/1.png","transportation/2.png","transportation/3.png","transportation/4.png","transportation/5.png","transportation/6.png"],
  information: ["information/1.png","information/2.png","information/3.png","information/4.png","information/5.png","information/6.png"],
  media: ["media/1.png","media/2.png","media/3.png","media/4.png","media/5.png","media/6.png"],
  "finance-insurance": ["finance-insurance/1.png","finance-insurance/2.png","finance-insurance/3.png","finance-insurance/4.png","finance-insurance/5.png","finance-insurance/6.png"],
  "real-estate": ["real-estate/1.png","real-estate/2.png","real-estate/3.png","real-estate/4.png","real-estate/5.png","real-estate/6.png"],
  "professional-services": ["professional-services/1.png","professional-services/2.png","professional-services/3.png","professional-services/4.png","professional-services/5.png","professional-services/6.png"],
  management: ["management/1.png","management/2.png","management/3.png","management/4.png"],
  "admin-support-waste": ["admin-support-waste/1.png","admin-support-waste/2.png","admin-support-waste/3.png","admin-support-waste/4.png","admin-support-waste/5.png","admin-support-waste/6.png"],
  education: ["education/1.png","education/2.png","education/3.png","education/4.png","education/5.png","education/6.png"],
  healthcare: ["healthcare/1.png","healthcare/2.png","healthcare/3.png","healthcare/4.png","healthcare/5.png","healthcare/6.png"],
  "arts-entertainment": ["arts-entertainment/1.png","arts-entertainment/2.png","arts-entertainment/3.png","arts-entertainment/4.png","arts-entertainment/5.png","arts-entertainment/6.png"],
  "accommodation-food": ["accommodation-food/1.png","accommodation-food/2.png","accommodation-food/3.png","accommodation-food/4.png","accommodation-food/5.png","accommodation-food/6.png"],
  "other-services": ["other-services/1.png","other-services/2.png","other-services/3.png","other-services/4.png","other-services/5.png","other-services/6.png"],
  "public-admin": ["public-admin/1.png","public-admin/2.png","public-admin/3.png","public-admin/4.png","public-admin/5.png","public-admin/6.png"],
};


// Public URL builder for Supabase Storage (PUBLIC bucket 'catalog')
export const imageUrl = (key: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalog/industries/${key}`;

// Map industry label -> slug
export const toSlug = (industryLabel: string | null | undefined) => {
  if (!industryLabel) return null;
  return INDUSTRY_SLUGS[industryLabel] ?? null;
};

