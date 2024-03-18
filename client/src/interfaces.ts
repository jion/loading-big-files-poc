export interface EntityOrigin {
  id: string;
  billing_address?: string;
  shipping_address?: string;
  payment?: string;
  customer?: string;
  subscription?: string;
  address?: string;
}

export interface Customer {
  merchant: string;
  merchant_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  live: boolean;
  id?: number | null;
  merchant_id?: number | null;
  phone_number?: string;
  phone_type?: number | null;
  locale?: string | null;
  extra_data?: any;
  price_code?: string | null;
  created?: string | null;
  last_updated?: string | null;
  user_token_id?: string | null;
  session_id?: string | null;
  origin?: EntityOrigin;
  errors?: string[];
}

export interface Address {
  customer: string;
  address_type: string;
  first_name?: string | null;
  last_name?: string | null;
  address?: string;
  address2?: string;
  city?: string;
  state_province_code?: string;
  zip_postal_code?: string;
  country_code?: string;
  live?: boolean;
  public_id?: string;
  label?: string;
  company_name?: string | null;
  phone?: string;
  fax?: string;
  created?: string;
  token_id?: string;
  store_public_id?: string;
  origin?: EntityOrigin;
  errors?: string[];
}

export interface Payment {
  customer: string;
  live: boolean;
  token_id: string;
  billing_address?: string;
  public_id?: string;
  cc_number: string;
  label?: string;
  cc_holder?: string | null;
  cc_type: number;
  cc_exp_date: string;
  payment_method: 'credit card' | 'paypal';
  created?: string;
  last_updated?: string;
  origin?: EntityOrigin;
  errors?: string[];
}

export interface Subscription {
  customer: string;
  product: string;
  offer: string;
  merchant_order_id?: string;
  live: boolean;
  every: number;
  every_period: 'day' | 'week' | 'month';
  quantity: number;
  price: string;
  payment?: string;
  shipping_address?: string;
  start_date: string;
  cancelled?: string | null;
  cancel_reason?: string | null;
  cancel_reason_code?: string | null;
  next_order_date?: string | null;
  extra_data?: any;
  public_id?: string;
  session_id?: string;
  components?: any;
  currency_code?: string;
  prepaid_subscription_context?: any;
  origin?: EntityOrigin;
  errors?: string[];
}

export interface OgData {
  customer: Customer;
  addresses: Address[];
  payments: Payment[];
  subscriptions: Subscription[];
  errors?: string[];
}

export type OgEntities = 'customer' | 'subscription' | 'payment' | 'address';

export type OgDataError = {
  error: string;
  path: string;
  entity?: OgEntities;
};
