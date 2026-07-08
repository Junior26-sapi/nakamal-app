/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'manager' | 'supplier' | 'user' | 'exporter';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  password?: string; // Only for admin demo
  passwordHash?: string; // Encrypted secure password for user accounts
  recoveryQuestion?: string; // Selected password recovery question
  recoveryAnswerHash?: string; // Hashed answer for password recovery questions
  barId?: string; // For managers
  approved?: boolean;
  subscriptionActive?: boolean;
  logoUrl?: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  supplierTitle?: 'Green Kava' | 'Sun-Dried Kava (Powder)' | '(Instant) Powdered Kava';
  location?: { 
    lat: number; 
    lng: number; 
    address: string; 
  };
  businessHours?: {
    [day: string]: { open: string; close: string; closed: boolean };
  };
  description?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  businessName?: string;
  contactPerson?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  exporterRates?: {
    greenKavaRoots: number;
    greenKavaChips: number;
    sunDriedKavaRoots: number;
    sunDriedKavaChips: number;
    instantPowder?: number;
  };
  certifications?: string[];
  country?: string;
  subscription?: {
    planId: 'monthly' | 'quarterly' | 'annual';
    status: 'active' | 'past_due' | 'canceled';
    currentPeriodEnd: number;
    autoRenew: boolean;
    isTrial?: boolean;
  };
  trialRenewalRequest?: {
    planId: 'monthly' | 'quarterly' | 'annual';
    amount: number;
    receiptUrl: string;
    note?: string;
    timestamp: number;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export interface SubscriptionPlan {
  id: 'monthly' | 'quarterly' | 'annual';
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'void';
  date: number;
  description: string;
  pdfUrl?: string;
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  failedPaymentsCount: number;
  trends?: { month: string; revenue: number; activeUsers: number; billingCycles: number }[];
  plansBreakdown?: { name: string; count: number; revenue: number }[];
}

export interface StatusLog {
  status: 'open' | 'closed';
  timestamp: number;
}

export interface Bar {
  id: string;
  name: string;
  address: string;
  status: 'open' | 'closed';
  category: string;
  description: string;
  tags: string[];
  pricePreview: number; // Lowest price item info
  managerId: string;
  lat?: number;
  lng?: number;
  businessHours?: {
    [day: string]: { open: string; close: string; closed: boolean };
  };
  statusHistory?: StatusLog[];
  logoUrl?: string;
  photos?: string[];
  menu?: MenuItem[];
}

export interface MenuItem {
  name: string;
  price: number;
  promotionPrice?: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  status?: 'In Stock' | 'Out of Stock' | 'Low Stock';
  reviews?: ProductReview[];
}

export interface Comment {
  author: string;
  text: string;
  date: string;
  likes: number;
}

export interface ProductReview {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockLevel?: number;
  supplierId: string;
  barId: string | null;
  imageUrl?: string;
  status?: 'In Stock' | 'Out of Stock' | 'Low Stock';
  tags?: string[];
  reviews?: ProductReview[];
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface B2BMessage {
  fromId: string;
  toId: string;
  text: string;
  type?: 'text' | 'order_request' | 'delivery_alert';
  timestamp: number;
  attachments?: {
    type: 'product_info' | 'purchase_order' | 'delivery_note';
    refId: string;
    quantity?: number;
    details?: any;
  }[];
}

export interface BarUpdate {
  id: string;
  barId: string;
  type: 'product' | 'event' | 'notice';
  title: string;
  description: string;
  imageUrl?: string;
  adImageUrl?: string;
  timestamp: number;
  isApproved: boolean;
  visibility?: 'public' | 'business';
  reactions?: { [key: string]: number };
  comments?: Comment[];
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  barId?: string;
  supplierId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: 'Pending' | 'Completed';
  dueDate?: number;
  assignedTo?: string;
  createdAt: number;
}
