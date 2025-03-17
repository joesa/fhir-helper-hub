
export interface PatientFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: Date | undefined;
  subscriberId: string;
  providerNpi: string;
  providerName: string;
  serviceLocation: string;
}
