import type { OpeningHours } from '@repo/shared'

export const seedCategories = [
  { name: 'Starters', sortOrder: 1 },
  { name: 'Mains', sortOrder: 2 },
  { name: 'Noodles & Rice', sortOrder: 3 },
  { name: 'Dim Sum', sortOrder: 4 },
  { name: 'Soups', sortOrder: 5 },
  { name: 'Sides', sortOrder: 6 },
  { name: 'Desserts', sortOrder: 7 },
  { name: 'Drinks', sortOrder: 8 },
] as const

export type SeedCategoryName = (typeof seedCategories)[number]['name']

type SeedMenuItem = {
  category: SeedCategoryName
  name: string
  description: string
  priceCents: number
  isAvailable?: boolean
}

export const seedMenuItems: SeedMenuItem[] = [
  // Starters
  {
    category: 'Starters',
    name: 'Roti Prata',
    description: 'Two pieces, curry dip',
    priceCents: 480,
  },
  {
    category: 'Starters',
    name: 'Satay Skewers',
    description: 'Six sticks, peanut sauce',
    priceCents: 1180,
  },
  {
    category: 'Starters',
    name: 'Ngoh Hiang',
    description: 'Five-spice pork rolls',
    priceCents: 920,
  },
  {
    category: 'Starters',
    name: 'Popiah',
    description: 'Fresh spring roll, turnip and prawn',
    priceCents: 760,
  },
  {
    category: 'Starters',
    name: 'Otah',
    description: 'Grilled spiced fish cake in banana leaf',
    priceCents: 640,
    isAvailable: false,
  },
  {
    category: 'Starters',
    name: 'Har Cheong Gai',
    description: 'Prawn paste chicken wings, six pieces',
    priceCents: 780,
  },
  {
    category: 'Starters',
    name: 'Kueh Pie Tee',
    description: 'Crisp cups, turnip and prawn',
    priceCents: 840,
  },
  {
    category: 'Starters',
    name: 'Rojak',
    description: 'Fruit and dough fritter, prawn paste',
    priceCents: 720,
  },
  {
    category: 'Starters',
    name: 'Vadai',
    description: 'Lentil fritter, curry leaf',
    priceCents: 400,
  },

  // Mains
  {
    category: 'Mains',
    name: 'Hainanese Chicken Rice',
    description: 'Poached chicken, chilli, ginger',
    priceCents: 1450,
  },
  {
    category: 'Mains',
    name: 'Chilli Crab',
    description: 'Whole mud crab, mantou buns',
    priceCents: 6800,
  },
  {
    category: 'Mains',
    name: 'Black Pepper Crab',
    description: 'Whole mud crab, cracked pepper',
    priceCents: 6800,
    isAvailable: false,
  },
  {
    category: 'Mains',
    name: 'Beef Rendang',
    description: 'Slow-cooked, coconut and lemongrass',
    priceCents: 1980,
  },
  {
    category: 'Mains',
    name: 'Sambal Stingray',
    description: 'Grilled on banana leaf',
    priceCents: 2200,
  },
  {
    category: 'Mains',
    name: 'Ayam Penyet',
    description: 'Smashed fried chicken, sambal',
    priceCents: 1380,
  },
  {
    category: 'Mains',
    name: 'Fish Head Curry',
    description: 'Red snapper, okra, aubergine',
    priceCents: 3400,
  },
  {
    category: 'Mains',
    name: 'Salted Egg Chicken',
    description: 'Curry leaf, chilli padi',
    priceCents: 1620,
  },
  {
    category: 'Mains',
    name: 'Sweet and Sour Pork',
    description: 'Crisp pork, pineapple, capsicum',
    priceCents: 1680,
  },
  {
    category: 'Mains',
    name: 'Curry Chicken',
    description: 'Potato, coconut gravy, baguette',
    priceCents: 1580,
  },
  {
    category: 'Mains',
    name: 'Roast Duck',
    description: 'Half bird, plum sauce',
    priceCents: 2600,
  },
  {
    category: 'Mains',
    name: 'Sambal Petai Prawns',
    description: 'Stink beans, chilli paste',
    priceCents: 2200,
    isAvailable: false,
  },

  // Noodles & Rice
  {
    category: 'Noodles & Rice',
    name: 'Char Kway Teow',
    description: 'Flat noodles, cockles, lup cheong',
    priceCents: 1280,
  },
  {
    category: 'Noodles & Rice',
    name: 'Laksa',
    description: 'Coconut curry noodles, prawns',
    priceCents: 1350,
  },
  {
    category: 'Noodles & Rice',
    name: 'Hokkien Mee',
    description: 'Prawn and squid, egg noodles',
    priceCents: 1280,
  },
  {
    category: 'Noodles & Rice',
    name: 'Mee Goreng',
    description: 'Spiced fried noodles, mutton',
    priceCents: 1180,
  },
  {
    category: 'Noodles & Rice',
    name: 'Nasi Lemak',
    description: 'Coconut rice, ikan bilis, egg',
    priceCents: 1050,
  },
  {
    category: 'Noodles & Rice',
    name: 'Bak Chor Mee',
    description: 'Minced pork noodles, vinegar',
    priceCents: 980,
  },
  {
    category: 'Noodles & Rice',
    name: 'Wonton Noodles',
    description: 'Char siu, prawn wontons',
    priceCents: 1080,
  },
  {
    category: 'Noodles & Rice',
    name: 'Nasi Briyani',
    description: 'Basmati, mutton, achar',
    priceCents: 1450,
  },
  {
    category: 'Noodles & Rice',
    name: 'Beef Hor Fun',
    description: 'Wok-charred flat noodles, egg gravy',
    priceCents: 1380,
  },
  {
    category: 'Noodles & Rice',
    name: 'Seafood Fried Rice',
    description: 'Prawn, crab meat, spring onion',
    priceCents: 1280,
  },
  {
    category: 'Noodles & Rice',
    name: 'Fried Bee Hoon',
    description: 'Cabbage, egg, fish cake',
    priceCents: 880,
  },

  // Dim Sum
  {
    category: 'Dim Sum',
    name: 'Har Gow',
    description: 'Steamed prawn dumplings, four pieces',
    priceCents: 720,
  },
  {
    category: 'Dim Sum',
    name: 'Siew Mai',
    description: 'Pork and prawn, four pieces',
    priceCents: 680,
  },
  {
    category: 'Dim Sum',
    name: 'Char Siew Bao',
    description: 'Steamed barbecue pork bun',
    priceCents: 560,
  },
  {
    category: 'Dim Sum',
    name: 'Xiao Long Bao',
    description: 'Soup dumplings, six pieces',
    priceCents: 880,
  },
  {
    category: 'Dim Sum',
    name: 'Chee Cheong Fun',
    description: 'Rice rolls, sweet soy, sesame',
    priceCents: 620,
  },
  {
    category: 'Dim Sum',
    name: 'Lo Mai Gai',
    description: 'Glutinous rice and chicken, lotus leaf',
    priceCents: 740,
    isAvailable: false,
  },

  // Soups
  {
    category: 'Soups',
    name: 'Bak Kut Teh',
    description: 'Peppery pork rib broth, youtiao',
    priceCents: 1280,
  },
  {
    category: 'Soups',
    name: 'Sup Kambing',
    description: 'Mutton soup, fried shallots',
    priceCents: 1180,
  },
  {
    category: 'Soups',
    name: 'Fish Maw Soup',
    description: 'Crab meat, egg ribbon',
    priceCents: 1380,
  },
  {
    category: 'Soups',
    name: 'Lotus Root Soup',
    description: 'Pork ribs, peanuts, red dates',
    priceCents: 980,
  },
  {
    category: 'Soups',
    name: 'ABC Soup',
    description: 'Potato, carrot, corn, pork ribs',
    priceCents: 880,
  },

  // Sides
  {
    category: 'Sides',
    name: 'Kangkong Belacan',
    description: 'Water spinach, shrimp paste',
    priceCents: 880,
  },
  {
    category: 'Sides',
    name: 'Cereal Prawns',
    description: 'Butter cereal, curry leaf',
    priceCents: 1980,
  },
  {
    category: 'Sides',
    name: 'Salted Egg Tofu',
    description: 'Crisp tofu, salted egg sauce',
    priceCents: 1120,
  },
  { category: 'Sides', name: 'Achar', description: 'Pickled vegetables, peanuts', priceCents: 520 },
  { category: 'Sides', name: 'Fried Egg', description: 'Runny yolk, soy', priceCents: 260 },
  {
    category: 'Sides',
    name: 'Sambal Eggplant',
    description: 'Brinjal, dried shrimp',
    priceCents: 980,
  },
  {
    category: 'Sides',
    name: 'Crispy Baby Squid',
    description: 'Sweet chilli, peanuts',
    priceCents: 1080,
  },
  {
    category: 'Sides',
    name: 'Sambal Long Beans',
    description: 'Wok-fried, minced pork',
    priceCents: 860,
  },
  {
    category: 'Sides',
    name: 'Chye Sim, Oyster Sauce',
    description: 'Blanched greens, fried garlic',
    priceCents: 780,
  },

  // Desserts
  {
    category: 'Desserts',
    name: 'Chendol',
    description: 'Coconut, gula melaka, pandan jelly',
    priceCents: 620,
  },
  {
    category: 'Desserts',
    name: 'Ice Kachang',
    description: 'Shaved ice, red bean, attap',
    priceCents: 580,
  },
  {
    category: 'Desserts',
    name: 'Kaya Toast',
    description: 'Charcoal toast, coconut jam',
    priceCents: 420,
  },
  {
    category: 'Desserts',
    name: 'Mango Sago',
    description: 'Pomelo, coconut cream',
    priceCents: 680,
  },
  {
    category: 'Desserts',
    name: 'Bubur Cha Cha',
    description: 'Sweet potato, yam, coconut milk',
    priceCents: 640,
  },
  {
    category: 'Desserts',
    name: 'Tau Huay',
    description: 'Silken beancurd, ginger syrup',
    priceCents: 380,
  },
  {
    category: 'Desserts',
    name: 'Ondeh Ondeh',
    description: 'Pandan balls, gula melaka, coconut',
    priceCents: 520,
  },
  {
    category: 'Desserts',
    name: 'Durian Pengat',
    description: 'D24 pulp, coconut cream',
    priceCents: 980,
    isAvailable: false,
  },

  // Drinks
  { category: 'Drinks', name: 'Teh Tarik', description: 'Pulled milk tea', priceCents: 320 },
  { category: 'Drinks', name: 'Kopi O', description: 'Black coffee, sugar', priceCents: 280 },
  {
    category: 'Drinks',
    name: 'Bandung',
    description: 'Rose syrup, evaporated milk',
    priceCents: 360,
  },
  {
    category: 'Drinks',
    name: 'Lime Juice',
    description: 'Fresh calamansi, salted plum',
    priceCents: 340,
  },
  {
    category: 'Drinks',
    name: 'Sugarcane Juice',
    description: 'Cold pressed',
    priceCents: 380,
    isAvailable: false,
  },
  {
    category: 'Drinks',
    name: 'Milo Dinosaur',
    description: 'Iced Milo, extra powder',
    priceCents: 420,
  },
  { category: 'Drinks', name: 'Teh Halia', description: 'Ginger milk tea', priceCents: 340 },
  { category: 'Drinks', name: 'Barley Water', description: 'Chilled, with lemon', priceCents: 300 },
  {
    category: 'Drinks',
    name: 'Soya Bean Milk',
    description: 'Freshly ground, lightly sweet',
    priceCents: 320,
  },
  {
    category: 'Drinks',
    name: 'Chrysanthemum Tea',
    description: 'Lightly sweetened, chilled',
    priceCents: 320,
  },
]

export const seedCustomers = [
  {
    name: 'Aisyah Rahman',
    phone: '+65 8123 4567',
    email: 'aisyah.rahman@example.com',
    notes: 'Allergic to shellfish',
  },
  { name: 'Daniel Tan', phone: '+65 9234 5678', email: 'daniel.tan@example.com', notes: null },
  {
    name: 'Priya Nair',
    phone: '+65 8345 6789',
    email: 'priya.nair@example.com',
    notes: 'Vegetarian',
  },
  {
    name: 'Marcus Lim',
    phone: '+65 9456 7890',
    email: 'marcus.lim@example.com',
    notes: 'Regular — Friday lunch',
  },
  { name: 'Siti Nurhaliza', phone: '+65 8567 8901', email: 'siti.n@example.com', notes: null },
  {
    name: 'Wei Jie Ong',
    phone: '+65 9678 9012',
    email: 'weijie.ong@example.com',
    notes: 'Prefers no coriander',
  },
  { name: 'Rachel Goh', phone: '+65 8789 0123', email: 'rachel.goh@example.com', notes: null },
  {
    name: 'Arjun Menon',
    phone: '+65 9890 1234',
    email: 'arjun.menon@example.com',
    notes: 'Corporate account',
  },
  { name: 'Hui Ling Chua', phone: '+65 8901 2345', email: 'huiling.chua@example.com', notes: null },
  {
    name: 'Farid Ismail',
    phone: '+65 9012 3456',
    email: 'farid.ismail@example.com',
    notes: 'Halal only',
  },
  { name: 'Jasmine Koh', phone: '+65 8234 5670', email: 'jasmine.koh@example.com', notes: null },
  {
    name: 'Ravi Subramaniam',
    phone: '+65 9345 6781',
    email: 'ravi.s@example.com',
    notes: 'Extra spicy',
  },
  { name: 'Clara Wong', phone: '+65 8456 7892', email: 'clara.wong@example.com', notes: null },
  {
    name: 'Nurul Huda',
    phone: '+65 9567 8903',
    email: 'nurul.huda@example.com',
    notes: 'Birthday in March',
  },
  { name: 'Benjamin Sim', phone: '+65 8678 9014', email: 'ben.sim@example.com', notes: null },
]

/**
 * Open around the clock, every day — a seed, not a real trading week.
 *
 * A demo runs from whatever timezone the viewer sits in, and the API's
 * opening-hours check is deliberately absolute: 11:00–22:00 in Asia/Singapore
 * is 05:00–16:00 in Europe/Paris, so a European afternoon would meet nothing
 * but OUTSIDE_OPENING_HOURS and read as a broken app. The rule still has teeth
 * — close any day in Settings and the refusal is one order away — but it is
 * demonstrated on purpose rather than tripped over.
 */
export const seedOpeningHours: OpeningHours = {
  mon: { open: '00:00', close: '23:59' },
  tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' },
  thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' },
  sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' },
}

export const seedCancellationReasons = [
  'Customer changed their mind',
  'Kitchen out of a key ingredient',
  'Delivery address outside our range',
  'Duplicate order placed by mistake',
]

export const seedOrderNotes = [
  null,
  null,
  null,
  'Less spicy please',
  'No coriander',
  'Extra napkins',
  'Ring the doorbell twice',
  'Table by the window if possible',
]
