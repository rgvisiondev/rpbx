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
    "agriculture/1.svg","agriculture/2.svg","agriculture/3.svg","agriculture/4.svg","agriculture/5.svg","agriculture/6.svg", "agriculture/7.svg"
  ],
  mining: ["mining/1.svg","mining/2.svg","mining/3.svg","mining/4.svg","mining/5.svg","mining/6.svg"],
  utilities: ["utilities/1.svg","utilities/2.svg","utilities/3.svg","utilities/4.svg","utilities/5.svg","utilities/6.svg"],
  construction: ["construction/1.svg","construction/2.svg","construction/3.svg","construction/4.svg","construction/5.svg","construction/6.svg"],
  manufacturing: ["manufacturing/1.svg","manufacturing/2.svg","manufacturing/3.svg","manufacturing/4.svg","manufacturing/5.svg","manufacturing/6.svg"],
  "wholesale-trade": ["wholesale-trade/1.svg","wholesale-trade/2.svg","wholesale-trade/3.svg","wholesale-trade/4.svg"],
  "retail-trade": ["retail-trade/1.svg","retail-trade/2.svg","retail-trade/3.svg","retail-trade/4.svg","retail-trade/5.svg","retail-trade/6.svg"],
  transportation: ["transportation/1.svg","transportation/2.svg","transportation/3.svg","transportation/4.svg","transportation/5.svg","transportation/6.svg"],
  information: ["information/1.svg","information/2.svg","information/3.svg","information/4.svg","information/5.svg","information/6.svg"],
  media: ["media/1.svg","media/2.svg","media/3.svg","media/4.svg","media/5.svg","media/6.svg"],
  "finance-insurance": ["finance-insurance/1.svg","finance-insurance/2.svg","finance-insurance/3.svg","finance-insurance/4.svg","finance-insurance/5.svg","finance-insurance/6.svg"],
  "real-estate": ["real-estate/1.svg","real-estate/2.svg","real-estate/3.svg","real-estate/4.svg","real-estate/5.svg","real-estate/6.svg"],
  "professional-services": ["professional-services/1.svg","professional-services/2.svg","professional-services/3.svg","professional-services/4.svg","professional-services/5.svg","professional-services/6.svg"],
  management: ["management/1.svg","management/2.svg","management/3.svg","management/4.svg"],
  "admin-support-waste": ["admin-support-waste/1.svg","admin-support-waste/2.svg","admin-support-waste/3.svg","admin-support-waste/4.svg","admin-support-waste/5.svg","admin-support-waste/6.svg"],
  education: ["education/1.svg","education/2.svg","education/3.svg","education/4.svg","education/5.svg","education/6.svg"],
  healthcare: ["healthcare/1.svg","healthcare/2.svg","healthcare/3.svg","healthcare/4.svg","healthcare/5.svg","healthcare/6.svg"],
  "arts-entertainment": ["arts-entertainment/1.svg","arts-entertainment/2.svg","arts-entertainment/3.svg","arts-entertainment/4.svg","arts-entertainment/5.svg","arts-entertainment/6.svg"],
  "accommodation-food": ["accommodation-food/1.svg","accommodation-food/2.svg","accommodation-food/3.svg","accommodation-food/4.svg","accommodation-food/5.svg","accommodation-food/6.svg"],
  "other-services": ["other-services/1.svg","other-services/2.svg","other-services/3.svg","other-services/4.svg","other-services/5.svg","other-services/6.svg"],
  "public-admin": ["public-admin/1.svg","public-admin/2.svg","public-admin/3.svg","public-admin/4.svg","public-admin/5.svg","public-admin/6.svg"],
};


// Public URL builder for Supabase Storage (PUBLIC bucket 'catalog')
export const imageUrl = (key: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalog/industries/${key}`;

// Map industry label -> slug
export const toSlug = (industryLabel: string | null | undefined) => {
  if (!industryLabel) return null;
  return INDUSTRY_SLUGS[industryLabel] ?? null;
};

