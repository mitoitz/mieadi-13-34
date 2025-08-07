export interface SystemConfiguration {
  id?: string;
  system_name: string;
  version: string;
  license_key?: string;
  max_users: number;
  expiration_date?: string;
  features: {
    multiTenant: boolean;
    auditLog: boolean;
    backup: boolean;
    customization: boolean;
  };
  customization: {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    success_color: string;
    danger_color: string;
    footer_text: string;
    terms_of_use: string;
  };
}

export interface SystemLicense {
  id?: string;
  license_key: string;
  organization_name?: string;
  max_users: number;
  features: {
    multiTenant: boolean;
    auditLog: boolean;
    backup: boolean;
    customization: boolean;
  };
  expiration_date?: string;
  status: 'active' | 'expired' | 'suspended';
}

export interface AdminLog {
  id?: string;
  admin_username: string;
  action: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface SystemStats {
  activeLicenses: number;
  totalUsers: number;
  totalCongregations: number;
}

export interface CreateMasterAdminData {
  name: string;
  email: string;
  cpf: string;
  password?: string;
}

export interface CreateMasterAdminResult {
  success: boolean;
  message: string;
  password?: string;
}