import { SystemConfigService } from "./system-config.service";
import { LicenseService } from "./license.service";
import { AdminLogService } from "./admin-log.service";
import { StatsService } from "./stats.service";
import { MasterAdminService } from "./master-admin.service";

export * from "./types";

export class AdminService {
  private systemConfigService = new SystemConfigService();
  private licenseService = new LicenseService();
  private adminLogService = new AdminLogService();
  private statsService = new StatsService();
  private masterAdminService = new MasterAdminService();

  // System Configuration methods
  async getSystemConfiguration() {
    return this.systemConfigService.getSystemConfiguration();
  }

  async updateSystemConfiguration(config: any) {
    const success = await this.systemConfigService.updateSystemConfiguration(config);
    if (success) {
      await this.adminLogService.logAdminAction('UPDATE_SYSTEM_CONFIG', 'Configurações do sistema atualizadas');
    }
    return success;
  }

  // License methods
  async getSystemLicenses() {
    return this.licenseService.getSystemLicenses();
  }

  async createSystemLicense(license: any) {
    const success = await this.licenseService.createSystemLicense(license);
    if (success) {
      await this.adminLogService.logAdminAction('CREATE_LICENSE', `Licença criada: ${license.license_key}`);
    }
    return success;
  }

  async updateSystemLicense(id: string, license: any) {
    const success = await this.licenseService.updateSystemLicense(id, license);
    if (success) {
      await this.adminLogService.logAdminAction('UPDATE_LICENSE', `Licença atualizada: ${id}`);
    }
    return success;
  }

  async deleteSystemLicense(id: string) {
    const success = await this.licenseService.deleteSystemLicense(id);
    if (success) {
      await this.adminLogService.logAdminAction('DELETE_LICENSE', `Licença removida: ${id}`);
    }
    return success;
  }

  generateLicenseKey() {
    return this.licenseService.generateLicenseKey();
  }

  // Stats methods
  async getSystemStats() {
    return this.statsService.getSystemStats();
  }

  // Log methods
  async logAdminAction(action: string, description?: string) {
    return this.adminLogService.logAdminAction(action, description);
  }

  async getAdminLogs() {
    return this.adminLogService.getAdminLogs();
  }

  // Master Admin methods
  async createMasterAdmin(adminData: any) {
    const result = await this.masterAdminService.createMasterAdmin(adminData);
    if (result.success) {
      await this.adminLogService.logAdminAction('CREATE_MASTER_ADMIN', `Admin master criado: ${adminData.name}`);
    }
    return result;
  }
}

export const adminService = new AdminService();