// Subscription plans shown on the Plan page. Prices are per restaurant per month.
// Changing a plan is done by us (galla team) for now, so restaurants can't upgrade
// themselves for free. Online payment comes later.
import type { Plan } from './settingsStore';

// Our support WhatsApp number with country code, digits only, e.g. '919876543210'.
// Empty: WhatsApp opens and the owner picks the contact.
export const SUPPORT_WHATSAPP = '';

export type PlanInfo = {
  id: Exclude<Plan, 'pilot'>;
  name: string;
  price: number; // rupees per month
  tagline: string;
  features: string[];
};

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    tagline: 'For trying galla',
    features: ['Counter billing on 1 phone', "Today's bills and sales", 'Backup file'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    tagline: 'For small counters and cafes',
    features: ['Everything in Free', 'Tables and dine-in', 'Staff PINs and roles', 'UPI QR and WhatsApp bills', 'Automatic cloud backup'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    tagline: 'For busy restaurants',
    features: ['Everything in Starter', 'Zomato and Swiggy orders', 'Printed bills and kitchen slips', 'Menu from a photo', 'Daily sales on WhatsApp'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 1499,
    tagline: 'For more counters and phones',
    features: ['Everything in Pro', 'Up to 3 phones together', 'Priority support'],
  },
];

export const PLAN_LABEL: Record<Plan, string> = {
  pilot: 'Pilot, all features free',
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};
