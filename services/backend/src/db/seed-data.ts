import type { OpeningHours } from '@repo/shared'

export const seedCategories = [
  { name: 'Starters', sortOrder: 1 },
  { name: 'Mains', sortOrder: 2 },
  { name: 'Noodles & Rice', sortOrder: 3 },
  { name: 'Sides', sortOrder: 4 },
  { name: 'Desserts', sortOrder: 5 },
  { name: 'Drinks', sortOrder: 6 },
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

export const seedOpeningHours: OpeningHours = {
  mon: { open: '11:00', close: '22:00' },
  tue: { open: '11:00', close: '22:00' },
  wed: { open: '11:00', close: '22:00' },
  thu: { open: '11:00', close: '22:00' },
  fri: { open: '11:00', close: '23:00' },
  sat: { open: '11:00', close: '23:00' },
  sun: { closed: true },
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
