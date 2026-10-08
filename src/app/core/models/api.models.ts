// ==========================================
// AUTH
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  roles: string[];
}

// ==========================================
// USER
// ==========================================

export interface UserDto {
  id: string;          // Guid
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

// ==========================================
// VEHICLE
// ==========================================

export interface VehicleDto {
  id: string;            // Guid
  immatriculation: string;
  marque: string;
  modele: string;
  capacite: number;
  status: string;        // "Available" | "OnMission" | "Maintenance" | "OutOfService"
  dateMiseEnService: string;
}

export interface CreateVehicleCommand {
  immatriculation: string;
  marque: string;
  modele: string;
  capacite: number;
  status: number;
  dateMiseEnService: string;
}

export interface UpdateVehicleCommand extends CreateVehicleCommand {
  id: string;
}

// ==========================================
// EMPLOYEE
// ==========================================

export interface EmployeeDto {
  id: string;            // Guid
  userId: string;
  matricule: string;
  position: string;
  hireDate: string;
  status: number;        // 0=Active 1=OnMission 2=OnLeave 3=Inactive
}

export interface CreateEmployeeCommand {
  userId: string;
  matricule: string;
  position: string;
  hireDate: string;
  status: number;
}

export interface UpdateEmployeeCommand extends CreateEmployeeCommand {
  id: string;
}

// ==========================================
// MISSION
// ==========================================

export interface MissionDto {
  id: string;            // Guid
  employeeId: string;
  vehicleId: string;
  dateDebut: string;
  dateFin: string;
  status: number;        // 0=Pending 1=InProgress 2=Completed 3=Cancelled
  origine: string;
  destination: string;
}

export interface CreateMissionCommand {
  employeeId: string;
  vehicleId: string;
  dateDebut: string;
  dateFin: string;
  status: number;
  origine: string;
  destination: string;
}

export interface UpdateMissionCommand extends CreateMissionCommand {
  id: string;
}

// ==========================================
// DELIVERY
// ==========================================

export interface DeliveryDto {
  id: string;            // Guid
  missionId: string;
  adresseLivraison: string;
  dateLivraison: string;
  status: number;        // 0=Pending 1=PickedUp 2=Delivered 3=Cancelled
}

export interface CreateDeliveryCommand {
  missionId: string;
  adresseLivraison: string;
  dateLivraison: string;
  status: number;
}

export interface UpdateDeliveryCommand extends CreateDeliveryCommand {
  id: string;
}

// ==========================================
// VEHICLE TRACKING
// ==========================================

export interface VehicleTrackingDto {
  id: string;            // Guid
  vehicleId: string;
  missionId: string;
  latitude: number;
  longitude: number;
  trackingDate: string;
}

export interface CreateVehicleTrackingCommand {
  vehicleId: string;
  missionId: string;
  latitude: number;
  longitude: number;
  trackingDate: string;
}

export interface UpdateVehicleTrackingCommand extends CreateVehicleTrackingCommand {
  id: string;
}

// ==========================================
// NOTIFICATION
// ==========================================

export interface NotificationDto {
  id: string;            // Guid
  userId: string;
  message: string;
  type: number;          // NotificationType enum
  isRead: boolean;
}

export interface CreateNotificationCommand {
  userId: string;
  message: string;
  type: number;
  isRead: boolean;
}

export interface UpdateNotificationCommand extends CreateNotificationCommand {
  id: string;
}

// ==========================================
// REVIEW
// ==========================================

export interface ReviewDto {
  id: string;            // Guid
  deliveryId: string;
  rating: number;        // 1-5
  comment: string;
  reviewDate: string;
}

export interface CreateReviewCommand {
  deliveryId: string;
  rating: number;
  comment: string;
  reviewDate: string;
}

export interface UpdateReviewCommand extends CreateReviewCommand {
  id: string;
}

// ==========================================
// AUDIT LOG
// ==========================================

export interface AuditLogDto {
  id: string;            // Guid
  userId: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string;
}
// ==========================================
// DASHBOARD
// ==========================================

export interface MonthlyStatDto {
  year: number;
  month: number;
  label: string;  // "Jan", "Feb", etc.
  count: number;
}

export interface DashboardStatsDto {
  totalUsers: number;
  totalEmployees: number;
  totalVehicles: number;
  totalMissions: number;
  totalDeliveries: number;
  availableVehicles: number;
  onMissionVehicles: number;
  maintenanceVehicles: number;
  outOfServiceVehicles: number;
  pendingMissions: number;
  inProgressMissions: number;
  completedMissions: number;
  cancelledMissions: number;
  pendingDeliveries: number;
  inTransitDeliveries: number;
  deliveredDeliveries: number;
  failedDeliveries: number;
  activeEmployees: number;
  onMissionEmployees: number;
  inactiveEmployees: number;
  recentMissions: RecentMissionDto[];
  missionsByMonth: MonthlyStatDto[];
  deliveriesByMonth: MonthlyStatDto[];
}

export interface RecentMissionDto {
  id: string;
  origine: string;
  destination: string;
  dateDebut: string | null;
  dateFin: string | null;
  status: number;
  statusLabel: string;
}
