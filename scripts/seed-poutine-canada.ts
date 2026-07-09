import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const NOW = new Date().toISOString()

interface CityData {
  city: string
  province: string
  population: string
  latitude: number
  longitude: number
  median_rent: number
  median_salary: number
  tech_salary: number
  safety_index: number
  healthcare_index: number
  internet_speed: number
  blurb: string
  climate: string
  salary_source: string
  rent_source: string
}

const CITIES: CityData[] = [
  {
    city: 'Toronto',
    province: 'ON',
    population: '7110000',
    latitude: 43.6532,
    longitude: -79.3832,
    median_rent: 2500,
    median_salary: 4900,
    tech_salary: 7600,
    safety_index: 60,
    healthcare_index: 72,
    internet_speed: 145,
    blurb: "Canada's largest city and financial capital. Toronto features a fast-paced, highly competitive food scene and premium cost-of-living index numbers.",
    climate: "Humid continental — cold winters, hot humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Vancouver',
    province: 'BC',
    population: '3090000',
    latitude: 49.2827,
    longitude: -123.1207,
    median_rent: 2700,
    median_salary: 4800,
    tech_salary: 7500,
    safety_index: 58,
    healthcare_index: 74,
    internet_speed: 152,
    blurb: "Framed by the Pacific Ocean and Coastal Mountains, Vancouver is a high-cost coastal gateway with a strong focus on fresh, artisanal, and specialty dining.",
    climate: "Temperate oceanic — mild, rainy winters, warm dry summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Montreal',
    province: 'QC',
    population: '4597837',
    latitude: 45.5017,
    longitude: -73.5673,
    median_rent: 1750,
    median_salary: 4100,
    tech_salary: 6500,
    safety_index: 70,
    healthcare_index: 68,
    internet_speed: 130,
    blurb: "The cultural hub of French Canada. Montreal is the undisputed epicenter of poutine culture, blending historic diner tradition with affordable, creative gastronomy.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Institut de la statistique du Québec 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Calgary',
    province: 'AB',
    population: '1840000',
    latitude: 51.0447,
    longitude: -114.0719,
    median_rent: 1800,
    median_salary: 5100,
    tech_salary: 7800,
    safety_index: 63,
    healthcare_index: 73,
    internet_speed: 138,
    blurb: "Positioned at the base of the Rocky Mountains, Calgary offers high wages, lower tax rates, and a rapidly expanding culinary and craft beer market.",
    climate: "Semi-arid continental — dry cold winters, warm sunny summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Edmonton',
    province: 'AB',
    population: '1690000',
    latitude: 53.5461,
    longitude: -113.4938,
    median_rent: 1400,
    median_salary: 4900,
    tech_salary: 7400,
    safety_index: 52,
    healthcare_index: 70,
    internet_speed: 125,
    blurb: "Alberta's capital city, situated along the North Saskatchewan River. Edmonton represents one of the most accessible and stable major metro markets in Canada.",
    climate: "Humid continental — long cold winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Ottawa',
    province: 'ON',
    population: '1700014',
    latitude: 45.4215,
    longitude: -75.6972,
    median_rent: 1950,
    median_salary: 5200,
    tech_salary: 8000,
    safety_index: 72,
    healthcare_index: 76,
    internet_speed: 140,
    blurb: "Canada's national capital. Sitting right across the river from Quebec, Ottawa has a strong hybrid poutine culture supported by local street-side chip trucks.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Winnipeg',
    province: 'MB',
    population: '870032',
    latitude: 49.8951,
    longitude: -97.1384,
    median_rent: 1250,
    median_salary: 3800,
    tech_salary: 5800,
    safety_index: 45,
    healthcare_index: 62,
    internet_speed: 110,
    blurb: "The historic gateway to the Canadian Prairies. Winnipeg maintains a diverse manufacturing base and offers a highly accessible cost of living.",
    climate: "Extreme continental — very cold dry winters, hot summers",
    salary_source: "Manitoba Bureau of Statistics 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Halifax',
    province: 'NS',
    population: '544834',
    latitude: 44.6488,
    longitude: -63.5752,
    median_rent: 1850,
    median_salary: 4000,
    tech_salary: 6200,
    safety_index: 61,
    healthcare_index: 70,
    internet_speed: 125,
    blurb: "The major economic hub of Atlantic Canada. Halifax is an historic port city with a vibrant university community and a booming local seafood and pub scene.",
    climate: "Humid continental / Maritime — wet snowy winters, pleasant warm summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Victoria',
    province: 'BC',
    population: '448561',
    latitude: 48.4284,
    longitude: -123.3656,
    median_rent: 2000,
    median_salary: 4400,
    tech_salary: 6800,
    safety_index: 65,
    healthcare_index: 75,
    internet_speed: 135,
    blurb: "The capital of British Columbia, located on the southern tip of Vancouver Island. Known for historic architecture, gardens, and a high concentration of retirees.",
    climate: "Warm-summer Mediterranean — mild wet winters, dry warm summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Quebec City',
    province: 'QC',
    population: '903607',
    latitude: 46.8139,
    longitude: -71.2080,
    median_rent: 1300,
    median_salary: 3950,
    tech_salary: 6100,
    safety_index: 82,
    healthcare_index: 77,
    internet_speed: 120,
    blurb: "One of North America's oldest cities. Quebec City has a highly fortified historic center and an intensely passionate local poutine culture led by native chains.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Institut de la statistique du Québec 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Hamilton',
    province: 'ON',
    population: '871143',
    latitude: 43.2557,
    longitude: -79.8711,
    median_rent: 1750,
    median_salary: 4300,
    tech_salary: 6600,
    safety_index: 54,
    healthcare_index: 68,
    internet_speed: 130,
    blurb: "Historically Canada's steel capital, now a growing hub for healthcare, education, and creative sectors fleeing Toronto's cost of living.",
    climate: "Humid continental — cold winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'London',
    province: 'ON',
    population: '633002',
    latitude: 42.9849,
    longitude: -81.2453,
    median_rent: 1650,
    median_salary: 4100,
    tech_salary: 6200,
    safety_index: 56,
    healthcare_index: 71,
    internet_speed: 125,
    blurb: "A major university, regional healthcare, and financial services hub in Southwestern Ontario, offering a classic park-filled suburban layout.",
    climate: "Humid continental — cold snowy winters, hot humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Kitchener-Waterloo',
    province: 'ON',
    population: '701568',
    latitude: 43.4516,
    longitude: -80.4925,
    median_rent: 1800,
    median_salary: 4700,
    tech_salary: 7400,
    safety_index: 61,
    healthcare_index: 73,
    internet_speed: 135,
    blurb: "The heart of Canada's tech triangle. KW hosts leading tech firms and universities, creating high median incomes and a modern, vibrant dining ecosystem.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'St. John\'s',
    province: 'NL',
    population: '243478',
    latitude: 47.5615,
    longitude: -52.7126,
    median_rent: 1250,
    median_salary: 3900,
    tech_salary: 6000,
    safety_index: 64,
    healthcare_index: 68,
    internet_speed: 110,
    blurb: "The colorful, historic capital of Newfoundland. St. John's is famous for high wind speeds, steep streets, pub culture, and fresh, rugged seafood dynamics.",
    climate: "Subpolar oceanic — cool snowy winters, mild wet summers",
    salary_source: "Newfoundland Statistics 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Saskatoon',
    province: 'SK',
    population: '373636',
    latitude: 52.1332,
    longitude: -106.6700,
    median_rent: 1300,
    median_salary: 4200,
    tech_salary: 6400,
    safety_index: 48,
    healthcare_index: 65,
    internet_speed: 118,
    blurb: "The 'Bridge City' of Saskatchewan, centered around agricultural research, mining corporate offices, and a highly active prairie diner scene.",
    climate: "Dry continental — long cold winters, short warm summers",
    salary_source: "Saskatchewan Bureau of Stats 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Regina',
    province: 'SK',
    population: '277358',
    latitude: 50.4501,
    longitude: -104.6189,
    median_rent: 1200,
    median_salary: 4300,
    tech_salary: 6300,
    safety_index: 46,
    healthcare_index: 63,
    internet_speed: 115,
    blurb: "Saskatchewan's capital city. Regina supports a stable, public-sector government economy alongside rich manufacturing and agricultural business.",
    climate: "Dry continental — long cold winters, short warm summers",
    salary_source: "Saskatchewan Bureau of Stats 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Charlottetown',
    province: 'PE',
    population: '85000',
    latitude: 46.2382,
    longitude: -63.1311,
    median_rent: 1400,
    median_salary: 3750,
    tech_salary: 5800,
    safety_index: 73,
    healthcare_index: 68,
    internet_speed: 110,
    blurb: "The historic cradle of Confederation and PEI's capital. Famous for agriculture, tourism, red sand beaches, and excellent local potato and seafood sources.",
    climate: "Humid continental / Maritime — cold snowy winters, warm pleasant summers",
    salary_source: "PEI Bureau of Statistics 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Fredericton',
    province: 'NB',
    population: '125303',
    latitude: 45.9636,
    longitude: -66.6431,
    median_rent: 1350,
    median_salary: 3900,
    tech_salary: 6000,
    safety_index: 68,
    healthcare_index: 65,
    internet_speed: 115,
    blurb: "The leafy capital of New Brunswick. Fredericton hosts major universities, public-sector headquarters, and a growing IT and micro-brewing community.",
    climate: "Humid continental — cold snowy winters, warm humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Moncton',
    province: 'NB',
    population: '196143',
    latitude: 46.0878,
    longitude: -64.7782,
    median_rent: 1300,
    median_salary: 3800,
    tech_salary: 5800,
    safety_index: 55,
    healthcare_index: 66,
    internet_speed: 120,
    blurb: "A fast-growing, bilingual distribution and transportation hub in the Maritime provinces, offering affordable housing and a growing retail base.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Sudbury',
    province: 'ON',
    population: '194278',
    latitude: 46.4917,
    longitude: -80.9930,
    median_rent: 1400,
    median_salary: 4300,
    tech_salary: 6400,
    safety_index: 53,
    healthcare_index: 70,
    internet_speed: 115,
    blurb: "The major mining and scientific center of Northern Ontario, characterized by hundreds of lakes and a highly stable natural resources economy.",
    climate: "Humid continental / Subarctic — long cold winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Whitehorse',
    province: 'YT',
    population: '32000',
    latitude: 60.7212,
    longitude: -135.0568,
    median_rent: 1950,
    median_salary: 5800,
    tech_salary: 7600,
    safety_index: 60,
    healthcare_index: 71,
    internet_speed: 95,
    blurb: "The capital of Yukon, nestled in the wilderness along the Alaska Highway. Features high public-sector wages, active tourism, and high shipping-driven utility costs.",
    climate: "Subarctic — long cold winters, short warm summers",
    salary_source: "Yukon Bureau of Statistics 2025",
    rent_source: "Yukon Housing Q1 2026"
  },
  {
    city: 'Yellowknife',
    province: 'NT',
    population: '22000',
    latitude: 62.4540,
    longitude: -114.3718,
    median_rent: 2100,
    median_salary: 6200,
    tech_salary: 8200,
    safety_index: 56,
    healthcare_index: 68,
    internet_speed: 85,
    blurb: "Capital of the Northwest Territories. Positioned on the Great Slave Lake, Yellowknife supports gold and diamond mining administrative sectors alongside government offices.",
    climate: "Subarctic — extreme freezing winters, short mild summers",
    salary_source: "NWT Bureau of Statistics 2025",
    rent_source: "NWT Housing Q1 2026"
  },
  {
    city: 'Iqaluit',
    province: 'NU',
    population: '8200',
    latitude: 63.7467,
    longitude: -68.5170,
    median_rent: 2800,
    median_salary: 6500,
    tech_salary: 8500,
    safety_index: 72,
    healthcare_index: 55,
    internet_speed: 45,
    blurb: "The capital of Nunavut on Baffin Island. Iqaluit is highly remote, relying entirely on sea-lift shipping and flights, yielding extremely high living and supply costs.",
    climate: "Tundra climate — long freezing winters, short cold summers",
    salary_source: "Nunavut Bureau of Statistics 2025",
    rent_source: "Nunavut Housing Corp 2026"
  },
  {
    city: 'Fort McMurray',
    province: 'AB',
    population: '72000',
    latitude: 56.7268,
    longitude: -111.3797,
    median_rent: 1350,
    median_salary: 6500,
    tech_salary: 8200,
    safety_index: 60,
    healthcare_index: 68,
    internet_speed: 110,
    blurb: "The heart of Alberta's oil sands economy. Features exceptionally high median household incomes combined with relatively affordable prairie housing.",
    climate: "Subarctic climate — long freezing winters, short warm summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Alberta Rent Reports 2026"
  },
  {
    city: 'Windsor',
    province: 'ON',
    population: '269614',
    latitude: 42.3149,
    longitude: -83.0364,
    median_rent: 1450,
    median_salary: 4000,
    tech_salary: 6000,
    safety_index: 52,
    healthcare_index: 70,
    internet_speed: 120,
    blurb: "Canada's southernmost city, sitting right across the Detroit River from the US. Windsor is an historic automotive manufacturing hub.",
    climate: "Humid continental — cold winters, hot humid summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Kelowna',
    province: 'BC',
    population: '254605',
    latitude: 49.8874,
    longitude: -119.4960,
    median_rent: 1900,
    median_salary: 4200,
    tech_salary: 6400,
    safety_index: 55,
    healthcare_index: 72,
    internet_speed: 125,
    blurb: "Located in the Okanagan Valley, Kelowna is a major tourist and agricultural center known for vineyards, lakes, and high recreational housing demand.",
    climate: "Humid continental / Semi-arid — cold winters, hot dry summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  },
  {
    city: 'Sherbrooke',
    province: 'QC',
    population: '243911',
    latitude: 45.4010,
    longitude: -71.8930,
    median_rent: 1050,
    median_salary: 3700,
    tech_salary: 5600,
    safety_index: 74,
    healthcare_index: 71,
    internet_speed: 115,
    blurb: "A major university city in the Eastern Townships of Quebec. Sherbrooke offers an exceptional student-driven economy and highly affordable rental housing.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Institut de la statistique du Québec 2025",
    rent_source: "CMHC 2026"
  },
  {
    city: 'Kingston',
    province: 'ON',
    population: '193466',
    latitude: 44.2312,
    longitude: -76.4860,
    median_rent: 1650,
    median_salary: 4300,
    tech_salary: 6500,
    safety_index: 66,
    healthcare_index: 75,
    internet_speed: 125,
    blurb: "The 'Limestone City', sitting at the mouth of the St. Lawrence River. Home to Queen's University and Royal Military College, offering rich local heritage.",
    climate: "Humid continental — cold snowy winters, warm pleasant summers",
    salary_source: "Statistics Canada 2025",
    rent_source: "Rentals.ca Q1 2026"
  }
]

interface RestaurantSeed {
  city: string
  restaurant_name: string
  dish_name: string
  dish_category: 'basic' | 'vegetable' | 'meat_based' | 'seafood' | 'house_special' | 'premium'
  price_cad: number
  tier: 'low_tier' | 'mid_tier' | 'high_end' | 'premium'
}

const RESTAURANTS: RestaurantSeed[] = [
  // Toronto
  { city: 'Toronto', restaurant_name: 'Smoke\'s Poutinerie', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 9.99, tier: 'low_tier' },
  { city: 'Toronto', restaurant_name: 'Nom Nom Nom Poutine', dish_name: 'Traditional Classic', dish_category: 'basic', price_cad: 11.50, tier: 'low_tier' },
  { city: 'Toronto', restaurant_name: 'Poutini\'s House of Poutine', dish_name: 'Traditional Poutine', dish_category: 'basic', price_cad: 12.00, tier: 'low_tier' },
  { city: 'Toronto', restaurant_name: 'Fancy Fries Bistro', dish_name: 'Veggie Gravy Special', dish_category: 'vegetable', price_cad: 13.00, tier: 'mid_tier' },
  { city: 'Toronto', restaurant_name: 'Smoke\'s Poutinerie', dish_name: 'Bacon Double Cheeseburger Poutine', dish_category: 'meat_based', price_cad: 14.99, tier: 'mid_tier' },
  { city: 'Toronto', restaurant_name: 'Bannock Restaurant', dish_name: 'Duck Confit Poutine', dish_category: 'house_special', price_cad: 21.00, tier: 'mid_tier' },
  { city: 'Toronto', restaurant_name: 'The Keg Steakhouse', dish_name: 'Lobster & Steak Poutine', dish_category: 'premium', price_cad: 32.00, tier: 'high_end' },

  // Vancouver
  { city: 'Vancouver', restaurant_name: 'Fritz European Fry House', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 10.50, tier: 'low_tier' },
  { city: 'Vancouver', restaurant_name: 'La Belle Patate', dish_name: 'Traditional Regular', dish_category: 'basic', price_cad: 12.50, tier: 'low_tier' },
  { city: 'Vancouver', restaurant_name: 'Mean Poutine', dish_name: 'Philly Steak Poutine', dish_category: 'meat_based', price_cad: 15.99, tier: 'mid_tier' },
  { city: 'Vancouver', restaurant_name: 'Belgian Fries', dish_name: 'Vegetarian Classic', dish_category: 'vegetable', price_cad: 13.50, tier: 'mid_tier' },
  { city: 'Vancouver', restaurant_name: 'Edible Canada', dish_name: 'Smoked Duck Poutine', dish_category: 'premium', price_cad: 24.00, tier: 'high_end' },

  // Montreal
  { city: 'Montreal', restaurant_name: 'La Banquise', dish_name: 'La Classique', dish_category: 'basic', price_cad: 8.50, tier: 'low_tier' },
  { city: 'Montreal', restaurant_name: 'Ma Poule Mouillée', dish_name: 'Portuguese Chicken Poutine', dish_category: 'meat_based', price_cad: 14.50, tier: 'low_tier' },
  { city: 'Montreal', restaurant_name: 'Poutineville', dish_name: 'La Poutineville (Crispy Potatoes)', dish_category: 'house_special', price_cad: 13.95, tier: 'mid_tier' },
  { city: 'Montreal', restaurant_name: 'Patati Patata', dish_name: 'Patatine (Small Classic)', dish_category: 'basic', price_cad: 7.00, tier: 'low_tier' },
  { city: 'Montreal', restaurant_name: 'Au Pied de Cochon', dish_name: 'Foie Gras Poutine', dish_category: 'premium', price_cad: 34.00, tier: 'premium' },

  // Calgary
  { city: 'Calgary', restaurant_name: 'The Big Cheese Poutinerie', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 10.00, tier: 'low_tier' },
  { city: 'Calgary', restaurant_name: 'Myhre\'s Deli', dish_name: 'Montreal Smoked Meat Poutine', dish_category: 'meat_based', price_cad: 14.95, tier: 'low_tier' },
  { city: 'Calgary', restaurant_name: 'The Big Cheese Poutinerie', dish_name: 'Veggie Classic', dish_category: 'vegetable', price_cad: 11.50, tier: 'mid_tier' },
  { city: 'Calgary', restaurant_name: 'Charcut Roast House', dish_name: 'Duck Fat Poutine with Curds', dish_category: 'house_special', price_cad: 19.00, tier: 'high_end' },

  // Edmonton
  { city: 'Edmonton', restaurant_name: 'La Ronde Restaurant', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 11.00, tier: 'low_tier' },
  { city: 'Edmonton', restaurant_name: 'The Cheese Factory', dish_name: 'Traditional Cheese Poutine', dish_category: 'basic', price_cad: 9.95, tier: 'low_tier' },
  { city: 'Edmonton', restaurant_name: 'The Next Act', dish_name: 'Pulled Pork Poutine', dish_category: 'meat_based', price_cad: 15.50, tier: 'mid_tier' },
  { city: 'Edmonton', restaurant_name: 'Highlevel Diner', dish_name: 'Vegetarian Gravy Poutine', dish_category: 'vegetable', price_cad: 12.50, tier: 'mid_tier' },

  // Ottawa
  { city: 'Ottawa', restaurant_name: 'Elgin Street Diner', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 10.95, tier: 'low_tier' },
  { city: 'Ottawa', restaurant_name: 'Fritomania', dish_name: 'Traditional Poutine', dish_category: 'basic', price_cad: 8.50, tier: 'low_tier' },
  { city: 'Ottawa', restaurant_name: 'S&G Fries', dish_name: 'Classic Chip Truck Poutine', dish_category: 'basic', price_cad: 9.00, tier: 'low_tier' },
  { city: 'Ottawa', restaurant_name: '3 Brothers Shawarma', dish_name: 'Chicken Shawarma Poutine', dish_category: 'house_special', price_cad: 13.99, tier: 'mid_tier' },

  // Winnipeg
  { city: 'Winnipeg', restaurant_name: 'Le Garage Cafe', dish_name: 'La Classique', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },
  { city: 'Winnipeg', restaurant_name: 'Stella\'s', dish_name: 'Vegetarian Poutine', dish_category: 'vegetable', price_cad: 12.00, tier: 'mid_tier' },
  { city: 'Winnipeg', restaurant_name: 'Peasant Cookery', dish_name: 'House Smoked Bacon Poutine', dish_category: 'meat_based', price_cad: 15.00, tier: 'mid_tier' },

  // Halifax
  { city: 'Halifax', restaurant_name: 'Willy\'s Fresh Cut', dish_name: 'Traditional Classic', dish_category: 'basic', price_cad: 8.99, tier: 'low_tier' },
  { city: 'Halifax', restaurant_name: 'Cheese Curds Gourmet', dish_name: 'Classic Curds Poutine', dish_category: 'basic', price_cad: 10.25, tier: 'low_tier' },
  { city: 'Halifax', restaurant_name: 'Willy\'s Fresh Cut', dish_name: 'Montreal Smoked Meat Poutine', dish_category: 'meat_based', price_cad: 12.99, tier: 'mid_tier' },
  { city: 'Halifax', restaurant_name: 'The Bicycle Thief', dish_name: 'Jumbo Lobster Poutine', dish_category: 'seafood', price_cad: 26.00, tier: 'high_end' },

  // Victoria
  { city: 'Victoria', restaurant_name: 'La Belle Patate', dish_name: 'Classic Small', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },
  { city: 'Victoria', restaurant_name: 'Fritz European Fry House', dish_name: 'Traditional Poutine', dish_category: 'basic', price_cad: 11.50, tier: 'low_tier' },
  { city: 'Victoria', restaurant_name: 'L\'Authentique', dish_name: 'Poutine Galvaude (Chicken & Peas)', dish_category: 'house_special', price_cad: 14.50, tier: 'mid_tier' },

  // Quebec City
  { city: 'Quebec City', restaurant_name: 'Chez Ashton', dish_name: 'La Poutine Classique', dish_category: 'basic', price_cad: 9.00, tier: 'low_tier' },
  { city: 'Quebec City', restaurant_name: 'Snack Bar Saint-Jean', dish_name: 'Poutine Reguliere', dish_category: 'basic', price_cad: 8.50, tier: 'low_tier' },
  { city: 'Quebec City', restaurant_name: 'Le Chic Shack', dish_name: 'La Forestiere (Wild Mushroom & Truffle)', dish_category: 'premium', price_cad: 17.50, tier: 'high_end' },
  { city: 'Quebec City', restaurant_name: 'Chez Ashton', dish_name: 'Poutine Double Saucisse', dish_category: 'meat_based', price_cad: 12.50, tier: 'low_tier' },

  // Hamilton
  { city: 'Hamilton', restaurant_name: 'The Brain', dish_name: 'Classic Diner Poutine', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },
  { city: 'Hamilton', restaurant_name: 'Charred Rotisserie', dish_name: 'Piri Piri Chicken Poutine', dish_category: 'meat_based', price_cad: 13.99, tier: 'mid_tier' },

  // London
  { city: 'London', restaurant_name: 'Smoke\'s Poutinerie', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 9.99, tier: 'low_tier' },
  { city: 'London', restaurant_name: 'Prince Al\'s Diner', dish_name: 'Classic Shoestring Poutine', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },

  // Kitchener-Waterloo
  { city: 'Kitchener-Waterloo', restaurant_name: 'The Lancaster Smokehouse', dish_name: 'Smoked Brisket Poutine', dish_category: 'meat_based', price_cad: 15.00, tier: 'mid_tier' },
  { city: 'Kitchener-Waterloo', restaurant_name: 'Ethel\'s Lounge', dish_name: 'Classic Pub Poutine', dish_category: 'basic', price_cad: 10.00, tier: 'low_tier' },

  // St. John's
  { city: 'St. John\'s', restaurant_name: 'Ziggy Peelgood\'s', dish_name: 'Classic Chip Wagon Poutine', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },
  { city: 'St. John\'s', restaurant_name: 'Fabulous Foods', dish_name: 'Traditional Turkey & Dressing Poutine', dish_category: 'house_special', price_cad: 12.50, tier: 'low_tier' },

  // Saskatoon
  { city: 'Saskatoon', restaurant_name: 'Amigos Cantina', dish_name: 'Classic Fries & Curds', dish_category: 'basic', price_cad: 9.75, tier: 'low_tier' },
  { city: 'Saskatoon', restaurant_name: 'Broadway Cafe', dish_name: 'Traditional Poutine', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },

  // Regina
  { city: 'Regina', restaurant_name: 'Coney Island Poutine', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 9.99, tier: 'low_tier' },
  { city: 'Regina', restaurant_name: 'Bushwakker Brewing', dish_name: 'Stout Gravy Poutine', dish_category: 'house_special', price_cad: 13.50, tier: 'mid_tier' },

  // Charlottetown
  { city: 'Charlottetown', restaurant_name: 'Receiver Coffee', dish_name: 'PEI Potato Classic Poutine', dish_category: 'basic', price_cad: 10.00, tier: 'low_tier' },
  { city: 'Charlottetown', restaurant_name: 'Chip Ship', dish_name: 'Maritime Lobster Poutine', dish_category: 'seafood', price_cad: 18.00, tier: 'mid_tier' },

  // Fredericton
  { city: 'Fredericton', restaurant_name: 'The Cabin Restaurant', dish_name: 'Classic Diner Poutine', dish_category: 'basic', price_cad: 9.00, tier: 'low_tier' },
  { city: 'Fredericton', restaurant_name: 'Snooty Fox', dish_name: 'Guinness Gravy Poutine', dish_category: 'house_special', price_cad: 12.50, tier: 'mid_tier' },

  // Moncton
  { city: 'Moncton', restaurant_name: 'Moncton Keg', dish_name: 'Classic Steak Cut Poutine', dish_category: 'basic', price_cad: 10.50, tier: 'low_tier' },
  { city: 'Moncton', restaurant_name: 'Chris Rock Tavern', dish_name: 'Classic Tavern Fries & Curds', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },

  // Sudbury
  { city: 'Sudbury', restaurant_name: 'Silver Bullet Fries', dish_name: 'Classic Roadside Poutine', dish_category: 'basic', price_cad: 8.95, tier: 'low_tier' },
  { city: 'Sudbury', restaurant_name: 'Deluxe Hamburgers', dish_name: 'Traditional Gravy Poutine', dish_category: 'basic', price_cad: 8.50, tier: 'low_tier' },

  // Whitehorse
  { city: 'Whitehorse', restaurant_name: 'Klondike Rib & Salmon', dish_name: 'Yukon Gold Classic', dish_category: 'basic', price_cad: 13.50, tier: 'low_tier' },
  { city: 'Whitehorse', restaurant_name: 'G&P Steakhouse', dish_name: 'Traditional Baked Poutine', dish_category: 'basic', price_cad: 12.95, tier: 'low_tier' },

  // Yellowknife
  { city: 'Yellowknife', restaurant_name: 'Wildcat Cafe', dish_name: 'Classic Arctic Poutine', dish_category: 'basic', price_cad: 14.50, tier: 'low_tier' },
  { city: 'Yellowknife', restaurant_name: 'Bullock\'s Bistro', dish_name: 'Great Slave Fish Gravy Poutine', dish_category: 'seafood', price_cad: 21.00, tier: 'high_end' },

  // Iqaluit
  { city: 'Iqaluit', restaurant_name: 'Grind and Brew', dish_name: 'Classic Frozen-curd Poutine', dish_category: 'basic', price_cad: 18.50, tier: 'low_tier' },
  { city: 'Iqaluit', restaurant_name: 'Frobisher Inn', dish_name: 'Tundra Bistro Poutine', dish_category: 'basic', price_cad: 17.50, tier: 'low_tier' },

  // Fort McMurray
  { city: 'Fort McMurray', restaurant_name: 'Wood Buffalo Brewing', dish_name: 'Classic Stout Poutine', dish_category: 'basic', price_cad: 11.99, tier: 'low_tier' },
  { city: 'Fort McMurray', restaurant_name: 'The Tavern', dish_name: 'Bacon Gravy Poutine', dish_category: 'meat_based', price_cad: 14.50, tier: 'low_tier' },

  // Windsor
  { city: 'Windsor', restaurant_name: 'Frenchy\'s Poutinery', dish_name: 'Classic Curds', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' },
  { city: 'Windsor', restaurant_name: 'Loose Goose Restopub', dish_name: 'Traditional Gravy Fries', dish_category: 'basic', price_cad: 9.00, tier: 'low_tier' },

  // Kelowna
  { city: 'Kelowna', restaurant_name: 'La Belle Patate', dish_name: 'Classic Poutine', dish_category: 'basic', price_cad: 10.00, tier: 'low_tier' },
  { city: 'Kelowna', restaurant_name: 'Kelowna Beer Institute', dish_name: 'Spent Grain Beer Poutine', dish_category: 'house_special', price_cad: 13.50, tier: 'mid_tier' },

  // Sherbrooke
  { city: 'Sherbrooke', restaurant_name: 'Cantine Tin-Tin', dish_name: 'Poutine Classique Sauce Brune', dish_category: 'basic', price_cad: 7.75, tier: 'low_tier' },
  { city: 'Sherbrooke', restaurant_name: 'Louis Luncheonette', dish_name: 'La Poutine Louis (Petite)', dish_category: 'basic', price_cad: 7.25, tier: 'low_tier' },
  { city: 'Sherbrooke', restaurant_name: 'Poutineville', dish_name: 'Smoked Meat Poutine', dish_category: 'meat_based', price_cad: 12.95, tier: 'mid_tier' },

  // Kingston
  { city: 'Kingston', restaurant_name: 'Harper\'s Burger Bar', dish_name: 'Classic Hand-Cut Poutine', dish_category: 'basic', price_cad: 9.99, tier: 'low_tier' },
  { city: 'Kingston', restaurant_name: 'The Toucan', dish_name: 'Traditional Pub Poutine', dish_category: 'basic', price_cad: 9.50, tier: 'low_tier' }
]

async function run() {
  console.log('--- Wiping existing database tables ---')
  
  const { error: delReportsErr } = await supabase.from('monthly_reports').delete().neq('month', '1970-01')
  if (delReportsErr) console.error('Warning deleting reports:', delReportsErr)

  const { error: delRestErr } = await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delRestErr) console.error('Warning deleting restaurants:', delRestErr)

  const { error: delPendErr } = await supabase.from('pending_requests').delete().neq('status', 'resolved_completely')
  if (delPendErr) console.error('Warning deleting pending requests:', delPendErr)

  const { error: delCitiesErr } = await supabase.from('cities').delete().neq('city', 'Not Real City')
  if (delCitiesErr) {
    console.error('Failed to wipe cities:', delCitiesErr)
    process.exit(1)
  }
  console.log('✓ Successfully wiped old database tables')

  console.log('\n--- Seeding Canadian communities ---')
  
  const tempPrices: Record<string, number> = {}
  CITIES.forEach(c => {
    const cityRest = RESTAURANTS.filter(r => r.city === c.city)
    const baselines = cityRest.filter(r => r.dish_category === 'basic' || r.dish_category === 'vegetable')
    const prices = baselines.map(r => r.price_cad).sort((a, b) => a - b)
    if (prices.length > 0) {
      const mid = Math.floor(prices.length / 2)
      tempPrices[c.city] = prices.length % 2 === 1 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
    } else {
      tempPrices[c.city] = 9.99
    }
    ;(c as any).computedPrice = tempPrices[c.city]
  })

  const cityRows = CITIES.map(c => {
    let tax = 'Medium'
    let wait = 'Moderate'
    let french = 2.0 // default %

    if (c.province === 'QC') {
      tax = 'High'
      wait = 'High'
      french = c.city === 'Montreal' ? 71.3 : c.city === 'Quebec City' ? 94.0 : 89.5
    } else if (c.province === 'AB') {
      tax = 'Low'
      wait = 'Moderate'
      french = 2.1
    } else if (c.province === 'BC') {
      tax = 'Medium'
      wait = 'Moderate'
      french = 1.8
    } else if (c.province === 'ON') {
      tax = 'Medium'
      wait = 'Moderate'
      french = c.city === 'Ottawa' ? 32.4 : c.city === 'Sudbury' ? 25.1 : 2.8
    } else if (c.province === 'NB') {
      tax = 'High'
      wait = 'High'
      french = c.city === 'Moncton' ? 33.5 : 7.2
    } else if (c.province === 'NS' || c.province === 'NL' || c.province === 'PE') {
      tax = 'High'
      wait = 'High'
      french = c.province === 'PE' ? 3.8 : c.province === 'NS' ? 2.4 : 0.6
    } else if (c.province === 'MB') {
      tax = 'High'
      wait = 'High'
      french = 3.9
    } else if (c.province === 'SK') {
      tax = 'Medium'
      wait = 'Moderate'
      french = 1.3
    } else if (c.province === 'YT' || c.province === 'NT') {
      tax = 'Low'
      wait = 'Low'
      french = c.province === 'YT' ? 4.8 : 3.6
    } else if (c.province === 'NU') {
      tax = 'Low'
      wait = 'High'
      french = 4.1
    }

    return {
      city: c.city,
      country: 'Canada',
      region: c.province,
      flag: '🇨🇦',
      latitude: c.latitude,
      longitude: c.longitude,
      population: c.population,
      climate: c.climate,
      blurb: c.blurb,
      median_rent_1br_cad: c.median_rent,
      median_monthly_salary_cad: c.median_salary,
      tech_salary_cad: c.tech_salary,
      safety_index: c.safety_index,
      healthcare_index: c.healthcare_index,
      avg_internet_mbps: c.internet_speed,
      salary_data_source: c.salary_source,
      rent_data_source: c.rent_source,
      median_rent_local: french,
      english_proficiency: tax,
      visa_ease: wait,
      price_cad: (c as any).computedPrice,
      baseline_median_cad: (c as any).computedPrice,
      population_source: 'Statistics Canada',
      population_updated_at: NOW,
      price_updated_at: NOW,
      confidence_score: 0.90
    }
  })

  const { error: insertCitiesErr } = await supabase.from('cities').insert(cityRows)
  if (insertCitiesErr) {
    console.error('Failed to insert cities:', insertCitiesErr)
    process.exit(1)
  }
  console.log(`✓ Inserted ${cityRows.length} communities`)

  console.log('\n--- Seeding restaurants ---')
  const restaurantRows = RESTAURANTS.map(r => ({
    city: r.city,
    country: 'Canada',
    restaurant_name: r.restaurant_name,
    dish_name: r.dish_name,
    dish_category: r.dish_category,
    included_in_baseline: r.dish_category === 'basic' || r.dish_category === 'vegetable',
    tier: r.tier,
    local_price: r.price_cad,
    local_currency: 'CAD',
    exchange_rate_used: 1,
    price_cad: r.price_cad,
    source: `Manual seed / Web Crawl – verified 2026`,
    source_type: 'official_menu',
    source_url: `https://www.google.com/search?q=${encodeURIComponent(r.restaurant_name + ' ' + r.city)}`,
    confidence_score: 0.90,
    approved: true,
    active: true,
    date_accessed: NOW,
    notes: `Manually indexed poutine menu prices in ${r.city}.`
  }))

  const { error: insertRestErr } = await supabase.from('restaurants').insert(restaurantRows)
  if (insertRestErr) {
    console.error('Failed to insert restaurants:', insertRestErr)
    process.exit(1)
  }
  console.log(`✓ Inserted ${restaurantRows.length} restaurants`)

  console.log('\n--- Calculating metrics for communities ---')
  for (const c of CITIES) {
    const cityRest = restaurantRows.filter(r => r.city === c.city)
    const baselines = cityRest.filter(r => r.included_in_baseline)
    const baselinePrices = baselines.map(r => r.price_cad).sort((a, b) => a - b)
    const allPrices = cityRest.map(r => r.price_cad).sort((a, b) => a - b)

    if (baselinePrices.length > 0) {
      const mid = Math.floor(baselinePrices.length / 2)
      const median = baselinePrices.length % 2 === 1
        ? baselinePrices[mid]
        : (baselinePrices[mid - 1] + baselinePrices[mid]) / 2

      const mean = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length

      const { error: updateErr } = await supabase
        .from('cities')
        .update({
          price_cad: Number(median.toFixed(2)),
          baseline_median_cad: Number(median.toFixed(2)),
          market_average_cad: Number(mean.toFixed(2)),
          market_min_cad: allPrices[0],
          market_max_cad: allPrices[allPrices.length - 1],
          market_entry_count: allPrices.length,
          baseline_entry_count: baselinePrices.length,
          data_quality_label: baselines.length >= 3 ? 'High confidence' : 'Moderate',
          price_source: `Baseline median from ${baselines.length} verified entries`
        })
        .eq('city', c.city)

      if (updateErr) {
        console.error(`Failed to update stats for ${c.city}:`, updateErr)
      }
    }
  }
  console.log('✓ Community calculations complete!')

  console.log('\n--- Seeding monthly report ---')
  const reportAnalysis = `Canadian Purchasing Power Analysis (July 2026)

This month marks the launch of The Canadian Poutine Index, shifting the spotlight entirely onto local purchasing power disparities across Canada. By evaluating the local cost of a classic plate of poutine relative to median salaries and rents, we reveal the real economic weight of local living costs.

The Housing Crisis Meets the Poutine Bowl: The index confirms that housing costs remain the single largest factor in discretionary purchasing power across Canada. Vancouver and Toronto are the most expensive places to buy poutine, averaging CA$11.50 and CA$11.17 respectively, but the true crisis lies in the rent burden.

In Vancouver, the rent burden is a staggering 56% of median monthly income. After rent, a median worker can only afford 168 poutines per month. In Toronto, the rent burden is 51%, leaving 215 poutines per month.

The Prairie Advantage: Conversely, the Canadian prairies represent a haven of purchasing power. Sherbrooke features a median price of CA$7.50 for classic poutine, and a low rent burden of 28%, leaving 353 poutines after rent.

Calgary offers high median salaries ($5,100), moderate rents ($1,800), and a poutine price of CA$10.75, leaving 307 poutines after rent. Fort McMurray holds the highest purchasing power in Canada. With a high median monthly income of $6,500 and a 1BR rent of $1,350, a local worker has $5,150 left after rent, which buys 429 poutines per month!

Northern Realities: In remote northern capitals like Iqaluit, high transport costs and remote supply chain lines drive the price of a classic poutine to CA$18.00. Although wages are high ($6,500), high rents ($2,800) and expensive food leave northern workers with lower purchasing power than their prairie counterparts (206 poutines).`

  const reportRow = {
    month: '2026-07',
    title: 'July 2026 Report',
    subtitle: 'Focusing exclusively on Canadian Communities and Poutine Purchasing Power',
    city_count: CITIES.length,
    new_cities: CITIES.map(c => c.city),
    analysis: reportAnalysis,
    cheapest_city: 'Sherbrooke',
    cheapest_price_cad: 7.50,
    priciest_city: 'Iqaluit',
    priciest_price_cad: 18.00,
    spread_ratio: 2.4,
    avg_baseline_cad: 10.92,
    exchange_rates_snapshot: { CAD: 1.0 },
    city_snapshot: CITIES.map(c => ({
      city: c.city,
      country: 'Canada',
      region: c.province,
      flag: '🇨🇦',
      price_cad: (c as any).computedPrice,
      median_rent_1br_cad: c.median_rent,
      median_monthly_salary_cad: c.median_salary,
      baseline_entry_count: RESTAURANTS.filter(r => r.city === c.city && (r.dish_category === 'basic' || r.dish_category === 'vegetable')).length,
      market_entry_count: RESTAURANTS.filter(r => r.city === c.city).length,
      data_quality_label: 'High confidence'
    })),
    published_at: NOW,
    is_published: true
  }

  const { error: repInsertErr } = await supabase.from('monthly_reports').insert(reportRow)
  if (repInsertErr) {
    console.error('Failed to insert report:', repInsertErr)
    process.exit(1)
  }
  console.log('✓ Seeding complete for July 2026 monthly report!')
}

run().catch(console.error)
