
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Database, FileText, UserCheck, Building, Briefcase, Stethoscope, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PatientFormData } from "@/types/patient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icd10Mapping } from "./Icd10MappingUploader";
import { CptMapping } from "./CptMappingUploader";
import { DatePicker } from "@/components/ui/date-picker";

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  isLoading?: boolean;
  icd10Mappings?: Icd10Mapping[];
  cptMappings?: CptMapping[];
}

const PatientForm = ({ onSubmit, isLoading, icd10Mappings = [], cptMappings = [] }: PatientFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: undefined,
    subscriberId: "",
    providerNpi: "",
    organizationName: "",
    practitionerFirstName: "",
    practitionerLastName: "",
    diagnosisCode: "",
    cptCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check specifically for the mandatory fields we're enforcing
    const mandatoryFields = ['lastName', 'dateOfBirth', 'subscriberId', 'diagnosisCode', 'cptCode', 'providerNpi'];
    const missingFields = mandatoryFields.filter(field => 
      field === 'dateOfBirth' ? !formData[field as keyof PatientFormData] : !(formData[field as keyof PatientFormData] as string)
    );
    
    if (missingFields.length > 0) {
      // Create a more specific error message that mentions the missing fields
      const fieldLabels = {
        lastName: 'Last Name',
        dateOfBirth: 'Date of Birth',
        subscriberId: 'Subscriber ID',
        diagnosisCode: 'Diagnosis Code (ICD-10)',
        cptCode: 'Procedure Code (CPT)',
        providerNpi: 'Provider NPI'
      };
      
      const missingFieldLabels = missingFields.map(field => fieldLabels[field as keyof typeof fieldLabels]);
      
      toast({
        title: "Required Fields Missing",
        description: `Please complete the following required fields: ${missingFieldLabels.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if either organization name OR practitioner information is provided
    const hasOrganization = !!formData.organizationName.trim();
    const hasPractitioner = !!(formData.practitionerFirstName.trim() && formData.practitionerLastName.trim());
    
    if (!hasOrganization && !hasPractitioner) {
      toast({
        title: "Provider Information Required",
        description: "Please provide either an Organization Name OR both Practitioner First and Last Name.",
        variant: "destructive",
      });
      return;
    }
    
    // Continue with other validations for remaining required fields
    const otherRequiredFields = ['firstName'];
    const otherMissingFields = otherRequiredFields.filter(field => 
      !(formData[field as keyof PatientFormData] as string)
    );
    
    if (otherMissingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-panel">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          Service Request
        </CardTitle>
        <CardDescription className="text-center">
          Enter the required information to create a service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Patient Information</h3>
            </div>
            <Separator className="my-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="required">First Name</Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 glass-input"
                    placeholder="Enter first name"
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="required font-bold">Last Name *</Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 glass-input border-2 border-primary-400"
                    placeholder="Enter last name"
                    required
                  />
                  <UserCheck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <div className="relative">
                <Input
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="pl-10 glass-input"
                  placeholder="Enter middle name (if any)"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="required font-bold">Date of Birth *</Label>
              <DatePicker
                date={formData.dateOfBirth}
                onDateChange={handleDateChange}
                placeholder="Select date of birth"
                required
                className="glass-input border-2 border-primary-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriberId" className="required font-bold">Subscriber ID *</Label>
              <div className="relative">
                <Input
                  id="subscriberId"
                  name="subscriberId"
                  value={formData.subscriberId}
                  onChange={handleChange}
                  className="pl-10 glass-input border-2 border-primary-400"
                  placeholder="Enter subscriber ID"
                  required
                />
                <Database className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosisCode" className="required font-bold">Diagnosis Code (ICD-10) *</Label>
              {icd10Mappings.length > 0 ? (
                <Select
                  value={formData.diagnosisCode}
                  onValueChange={(value) => handleSelectChange("diagnosisCode", value)}
                >
                  <SelectTrigger className="pl-10 glass-input border-2 border-primary-400">
                    <Stethoscope className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <SelectValue placeholder="Select diagnosis code" />
                  </SelectTrigger>
                  <SelectContent>
                    {icd10Mappings.map((code) => (
                      <SelectItem key={code.code} value={code.code}>
                        {code.code} - {code.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Input
                    id="diagnosisCode"
                    name="diagnosisCode"
                    value={formData.diagnosisCode}
                    onChange={handleChange}
                    className="pl-10 glass-input border-2 border-primary-400"
                    placeholder="Enter ICD-10 code"
                    required
                  />
                  <Stethoscope className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 space-y-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Provider Information</h3>
              <span className="text-sm text-gray-500">(Provide either Organization OR Practitioner)</span>
            </div>
            <Separator className="my-2" />

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <div className="relative">
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="pl-10 glass-input"
                  placeholder="Enter organization name"
                />
                <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-1 pt-2">
              <Label className="text-sm text-gray-600">OR</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="practitionerFirstName">Practitioner First Name</Label>
                <div className="relative">
                  <Input
                    id="practitionerFirstName"
                    name="practitionerFirstName"
                    value={formData.practitionerFirstName}
                    onChange={handleChange}
                    className="pl-10 glass-input"
                    placeholder="Enter practitioner first name"
                  />
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="practitionerLastName">Practitioner Last Name</Label>
                <div className="relative">
                  <Input
                    id="practitionerLastName"
                    name="practitionerLastName"
                    value={formData.practitionerLastName}
                    onChange={handleChange}
                    className="pl-10 glass-input"
                    placeholder="Enter practitioner last name"
                  />
                  <UserCheck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="providerNpi" className="required font-bold">Provider NPI *</Label>
              <div className="relative">
                <Input
                  id="providerNpi"
                  name="providerNpi"
                  value={formData.providerNpi}
                  onChange={handleChange}
                  className="pl-10 glass-input border-2 border-primary-400"
                  placeholder="Enter provider NPI"
                  required
                />
                <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cptCode" className="required font-bold">Procedure Code (CPT) *</Label>
              {cptMappings.length > 0 ? (
                <Select
                  value={formData.cptCode}
                  onValueChange={(value) => handleSelectChange("cptCode", value)}
                >
                  <SelectTrigger className="pl-10 glass-input border-2 border-primary-400">
                    <Activity className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <SelectValue placeholder="Select procedure code" />
                  </SelectTrigger>
                  <SelectContent>
                    {cptMappings.map((code) => (
                      <SelectItem key={code.code} value={code.code}>
                        {code.code} - {code.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <Input
                    id="cptCode"
                    name="cptCode"
                    value={formData.cptCode}
                    onChange={handleChange}
                    className="pl-10 glass-input border-2 border-primary-400"
                    placeholder="Enter CPT code"
                    required
                  />
                  <Activity className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PatientForm;
