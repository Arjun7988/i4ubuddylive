export interface Deal {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  category: string;
  imageUrl: string;
  location: string;
  distance: number; // in miles
  expiresAt: string; // ISO date string
  isSponsored?: boolean;
  isFeatured?: boolean;
  tags: string[];
  termsAndConditions?: string;
  redeemInstructions?: string;
}

export interface Merchant {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  location: string;
  distance: number; // in miles
  rating: number;
  reviewCount: number;
  activeDealsCount: number;
  isVerified: boolean;
  coverImage?: string;
}

export interface AdBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onClickTarget: string; // route or placeholder
  gradientFrom?: string;
  gradientTo?: string;
  icon?: string;
}

export interface DealCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
  color?: string;
}

export interface SmartEssential {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  deals: Deal[];
}
