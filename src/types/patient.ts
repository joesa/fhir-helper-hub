
export interface PatientFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: Date | undefined;
  subscriberId: string;
  providerNpi: string;
  organizationName: string;
  practitionerFirstName: string;
  practitionerLastName: string;
  diagnosisCode: string;
  cptCode: string;
}
