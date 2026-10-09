// Sample menu for testing. Prices are in paise (₹1 = 100 paise) so totals never
// have rounding errors. Later this will come from the menu setup screen.

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number; // paise
  veg: boolean;
};

export const CATEGORIES = ['Snacks', 'Main Course', 'Breads', 'Drinks', 'Sweets'];

export const SAMPLE_MENU: MenuItem[] = [
  { id: 's1', name: 'Samosa (2 pc)', category: 'Snacks', price: 4000, veg: true },
  { id: 's2', name: 'Paneer Tikka', category: 'Snacks', price: 22000, veg: true },
  { id: 's3', name: 'Chicken 65', category: 'Snacks', price: 24000, veg: false },
  { id: 's4', name: 'Veg Spring Roll', category: 'Snacks', price: 14000, veg: true },
  { id: 'm1', name: 'Dal Makhani', category: 'Main Course', price: 18000, veg: true },
  { id: 'm2', name: 'Shahi Paneer', category: 'Main Course', price: 22000, veg: true },
  { id: 'm3', name: 'Butter Chicken', category: 'Main Course', price: 28000, veg: false },
  { id: 'm4', name: 'Veg Biryani', category: 'Main Course', price: 20000, veg: true },
  { id: 'b1', name: 'Tandoori Roti', category: 'Breads', price: 2000, veg: true },
  { id: 'b2', name: 'Butter Naan', category: 'Breads', price: 4500, veg: true },
  { id: 'b3', name: 'Laccha Paratha', category: 'Breads', price: 5000, veg: true },
  { id: 'd1', name: 'Masala Chai', category: 'Drinks', price: 2000, veg: true },
  { id: 'd2', name: 'Sweet Lassi', category: 'Drinks', price: 6000, veg: true },
  { id: 'd3', name: 'Cold Drink', category: 'Drinks', price: 4000, veg: true },
  { id: 'w1', name: 'Gulab Jamun (2 pc)', category: 'Sweets', price: 5000, veg: true },
  { id: 'w2', name: 'Rasmalai', category: 'Sweets', price: 7000, veg: true },
];

// GST for most non-AC restaurants. This will become a setting per restaurant.
export const GST_PERCENT = 5;
