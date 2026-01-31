-- Migration: Create schemes table and populate with initial data
-- Created: 2026-01-31

-- Create schemes table
CREATE TABLE public.schemes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scheme_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('food', 'healthcare', 'general')),
  description text NOT NULL,
  eligibility_criteria text,
  financial_details jsonb,
  valid_from date,
  valid_until date,
  source_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schemes_pkey PRIMARY KEY (id)
);

-- Create index on category for faster queries by business type
CREATE INDEX idx_schemes_category ON public.schemes(category);

-- Create index for full-text search on scheme content (useful for RAG)
CREATE INDEX idx_schemes_search ON public.schemes USING gin(to_tsvector('english', scheme_name || ' ' || description || ' ' || COALESCE(eligibility_criteria, '')));

-- Insert Food Schemes
INSERT INTO public.schemes (scheme_name, category, description, eligibility_criteria, financial_details, valid_from, valid_until) VALUES
(
  'Production Linked Incentive Scheme for Food Processing (PLISFPI)',
  'food',
  'Implemented during 2021-22 to 2026-27 with an outlay of Rs. 10,900 crore to encourage food processing industries.',
  'Food processing industries',
  '{"outlay": "Rs. 10,900 crore", "duration": "2021-22 to 2026-27"}'::jsonb,
  '2021-04-01',
  '2027-03-31'
),
(
  'PM Formalisation of Micro Food Processing Enterprises (PMFME)',
  'food',
  'The flagship scheme with an outlay of Rs. 10,000 crore, operational from 2020-21 to 2025-26, targets two lakh micro food processing units including bakeries and restaurants. The scheme provides credit-linked capital subsidy at 35% of eligible project cost with a maximum ceiling of Rs. 10 lakh per unit. It offers seed capital up to Rs. 40,000 per SHG member for working capital and small tools, capacity building through entrepreneurship development programs, and branding and marketing support with grants up to 50% for groups. Common infrastructure support is available at 35% subsidy (maximum Rs. 3 crore) for setting up shared facilities',
  'Two lakh micro food processing units including bakeries and restaurants',
  '{"outlay": "Rs. 10,000 crore", "duration": "2020-21 to 2025-26", "target_units": 200000, "credit_linked_subsidy": {"rate": "35%", "max_amount": "Rs. 10 lakh per unit"}, "seed_capital": "Rs. 40,000 per SHG member", "branding_marketing_grant": "50% for groups", "common_infrastructure_subsidy": {"rate": "35%", "max_amount": "Rs. 3 crore"}}'::jsonb,
  '2020-04-01',
  '2026-03-31'
),
(
  'MUDRA (Micro Units Development and Refinance Agency)',
  'food',
  'Provides collateral-free loans up to Rs. 10 lakhs for small businesses including bakeries and restaurants. The scheme operates in three categories: Shishu (up to Rs. 50,000), Kishor (Rs. 50,000 to Rs. 5 lakh), and Tarun (Rs. 5 lakh to Rs. 10 lakh) with interest rates ranging from 8.40% to 12.45%.',
  'Small businesses including bakeries and restaurants',
  '{"loan_types": [{"name": "Shishu", "max_amount": "Rs. 50,000"}, {"name": "Kishor", "min_amount": "Rs. 50,000", "max_amount": "Rs. 5 lakh"}, {"name": "Tarun", "min_amount": "Rs. 5 lakh", "max_amount": "Rs. 10 lakh"}], "interest_rate_range": "8.40% to 12.45%", "collateral": "Not required"}'::jsonb,
  NULL,
  NULL
),
(
  'Credit Guarantee Scheme for Micro & Small Enterprises (CGTMSE)',
  'food',
  'Facilitates credit guarantees for credit facilities up to Rs. 10 crore to MSEs without requiring collateral security or third-party guarantees. This scheme is particularly beneficial for bakeries and restaurants lacking physical assets for collateral.',
  'Micro & Small Enterprises, particularly beneficial for bakeries and restaurants lacking physical assets for collateral',
  '{"max_credit_facility": "Rs. 10 crore", "collateral": "Not required", "third_party_guarantee": "Not required"}'::jsonb,
  NULL,
  NULL
);

-- Insert Healthcare Schemes
INSERT INTO public.schemes (scheme_name, category, description, eligibility_criteria, financial_details, valid_from, valid_until) VALUES
(
  'BOI Star Aarogyam Scheme',
  'healthcare',
  'Bank of India''s dedicated healthcare financing scheme provides loans up to Rs. 100 crore for qualified medical practitioners to set up clinics, nursing homes, hospitals, pathology labs, and diagnostic centers, or to import vaccines and COVID-related drugs. The scheme was launched to provide enhanced support to the healthcare sector amid the pandemic',
  'Qualified medical practitioners',
  '{"max_loan": "Rs. 100 crore", "eligible_purposes": ["clinics", "nursing homes", "hospitals", "pathology labs", "diagnostic centers", "import vaccines", "COVID-related drugs"]}'::jsonb,
  NULL,
  NULL
),
(
  'IND Health Care Scheme',
  'healthcare',
  'Indian Bank''s MSME structured loan product offers financing for hospitals, nursing homes, clinics, diagnostic centers, pathology laboratories, physiotherapy centers, eye treatment centers, ENT centers, and specialty clinics including skin clinics, dental clinics, dialysis centers, and endoscopy centers. Loans range from Rs. 10 lakh to Rs. 5 crore with interest rates between 9.50% and 10.00%. The scheme covers outright purchase/construction of buildings for setting up diagnostic centers, nursing homes, and other medical facilities.',
  'MSMEs in healthcare sector',
  '{"loan_range": {"min": "Rs. 10 lakh", "max": "Rs. 5 crore"}, "interest_rate": {"min": "9.50%", "max": "10.00%"}, "eligible_facilities": ["hospitals", "nursing homes", "clinics", "diagnostic centers", "pathology laboratories", "physiotherapy centers", "eye treatment centers", "ENT centers", "skin clinics", "dental clinics", "dialysis centers", "endoscopy centers"]}'::jsonb,
  NULL,
  NULL
),
(
  'AYUSH Super Specialty Hospitals Interest Subsidy Scheme',
  'healthcare',
  'Designed for private institutions, hospitals, investors, and SMEs willing to establish world-class super specialty hospitals or day care centers of systems recognized under Indian Medicine Central Council (IMCC) Act, 1970 or Homoeopathic Central Council (HCC) Act, 1973. SIDBI facilitates easy loans through identified public sector banks for a period not exceeding five years. The quantum of financial support is provided as interest subsidy in descending order: 100% (1st Year), 70% (2nd Year), 50% (3rd Year), 40% (4th Year), and 20% (5th Year).',
  'Private institutions, hospitals, investors, and SMEs willing to establish world-class super specialty hospitals or day care centers of systems recognized under IMCC Act, 1970 or HCC Act, 1973',
  '{"loan_period": "up to 5 years", "interest_subsidy": [{"year": 1, "subsidy": "100%"}, {"year": 2, "subsidy": "70%"}, {"year": 3, "subsidy": "50%"}, {"year": 4, "subsidy": "40%"}, {"year": 5, "subsidy": "20%"}], "facilitator": "SIDBI"}'::jsonb,
  NULL,
  NULL
),
(
  'Strengthening Pharmaceuticals Industry (SPI) Scheme',
  'healthcare',
  'Launched on July 21, 2022, with a total financial outlay of Rs. 500 crore across 5 years (FY 2021-22 to FY 2025-26), this initiative strengthens MSMEs in the pharmaceutical sector. The scheme facilitates technological upgradation by providing credit-linked capital and interest subsidy to MSMEs. It supports MSMEs in setting up common facilities including research centers, testing labs, and effluent treatment plants in pharmaceutical clusters. An outlay of Rs. 178 crore for five years is proposed to support clusters for creation of common facilities. The scheme helps pharmaceutical MSMEs meet national and international regulatory standards (WHO-GMP or Schedule-M).',
  'MSMEs in pharmaceutical sector',
  '{"launch_date": "2022-07-21", "outlay": "Rs. 500 crore", "duration": "FY 2021-22 to FY 2025-26", "cluster_support_outlay": "Rs. 178 crore", "benefits": ["technological upgradation", "credit-linked capital subsidy", "interest subsidy", "common facilities support"], "regulatory_standards": ["WHO-GMP", "Schedule-M"]}'::jsonb,
  '2021-04-01',
  '2026-03-31'
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schemes_updated_at BEFORE UPDATE ON public.schemes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant appropriate permissions (adjust as needed for your RLS policies)
-- GRANT SELECT ON public.schemes TO authenticated;
-- GRANT ALL ON public.schemes TO service_role;

COMMENT ON TABLE public.schemes IS 'Stores government schemes and regulations for different business categories';
COMMENT ON COLUMN public.schemes.category IS 'Category of the scheme: food, healthcare, or general';
COMMENT ON COLUMN public.schemes.financial_details IS 'JSON object containing loan amounts, interest rates, subsidies, etc.';
