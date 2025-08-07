import { useAuth, UserType } from "./useAuth";

// Definir permissões por role
const ROLE_PERMISSIONS = {
  diretor: {
    canManageUsers: true,
    canManageClasses: true,
    canManageFinances: true,
    canViewReports: true,
    canManageSettings: true,
    canManageCongregations: true,
    canManageFields: true,
    canManageCourses: true,
    canManageSubjects: true,
    canManageAttendance: true,
    canManageGrades: true,
    canViewAuditLogs: true,
  },
  admin: {
    canManageUsers: true,
    canManageClasses: true,
    canManageFinances: true,
    canViewReports: true,
    canManageSettings: true,
    canManageCongregations: true,
    canManageFields: true,
    canManageCourses: true,
    canManageSubjects: true,
    canManageAttendance: true,
    canManageGrades: true,
    canViewAuditLogs: true,
  },
  coordenador: {
    canManageUsers: true,
    canManageClasses: true,
    canManageFinances: true,
    canViewReports: true,
    canManageSettings: false,
    canManageCongregations: true,
    canManageFields: true,
    canManageCourses: true,
    canManageSubjects: true,
    canManageAttendance: true,
    canManageGrades: true,
    canViewAuditLogs: false,
  },
  secretario: {
    canManageUsers: true,
    canManageClasses: true,
    canManageFinances: true,
    canViewReports: true,
    canManageSettings: false,
    canManageCongregations: false,
    canManageFields: false,
    canManageCourses: false,
    canManageSubjects: false,
    canManageAttendance: true,
    canManageGrades: false,
    canViewAuditLogs: false,
  },
  pastor: {
    canManageUsers: false,
    canManageClasses: false,
    canManageFinances: false,
    canViewReports: true,
    canManageSettings: false,
    canManageCongregations: true,
    canManageFields: true,
    canManageCourses: false,
    canManageSubjects: false,
    canManageAttendance: true,
    canManageGrades: false,
    canViewAuditLogs: false,
  },
  professor: {
    canManageUsers: false,
    canManageClasses: true,
    canManageFinances: false,
    canViewReports: true,
    canManageSettings: false,
    canManageCongregations: false,
    canManageFields: false,
    canManageCourses: false,
    canManageSubjects: true,
    canManageAttendance: true,
    canManageGrades: true,
    canViewAuditLogs: false,
  },
  aluno: {
    canManageUsers: false,
    canManageClasses: false,
    canManageFinances: false,
    canViewReports: false,
    canManageSettings: false,
    canManageCongregations: false,
    canManageFields: false,
    canManageCourses: false,
    canManageSubjects: false,
    canManageAttendance: false,
    canManageGrades: false,
    canViewAuditLogs: false,
  },
  membro: {
    canManageUsers: false,
    canManageClasses: false,
    canManageFinances: false,
    canViewReports: false,
    canManageSettings: false,
    canManageCongregations: false,
    canManageFields: false,
    canManageCourses: false,
    canManageSubjects: false,
    canManageAttendance: false,
    canManageGrades: false,
    canViewAuditLogs: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.diretor;

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!isAuthenticated || !user?.role) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role as UserType];
    return rolePermissions?.[permission] || false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isRole = (role: UserType | UserType[]): boolean => {
    if (!isAuthenticated || !user?.role) {
      return false;
    }

    if (Array.isArray(role)) {
      return role.includes(user.role as UserType);
    }

    return user.role === role;
  };

  const getUserPermissions = () => {
    if (!isAuthenticated || !user?.role) {
      return {};
    }

    return ROLE_PERMISSIONS[user.role as UserType] || {};
  };

  return {
    user,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isRole,
    getUserPermissions,
    // Helpers específicos para roles
    isDirector: () => isRole('diretor'),
    isCoordinator: () => isRole('coordenador'),
    isSecretary: () => isRole('secretario'),
    isPastor: () => isRole('pastor'),
    isProfessor: () => isRole('professor'),
    isStudent: () => isRole('aluno'),
    isMember: () => isRole('membro'),
    // Helpers para grupos de permissão
    isAdmin: () => isRole('diretor'),
    isStaff: () => isRole(['diretor', 'coordenador', 'secretario']),
    isEducator: () => isRole(['diretor', 'coordenador', 'professor']),
    canManageSystem: () => hasAnyPermission(['canManageUsers', 'canManageSettings']),
  };
};