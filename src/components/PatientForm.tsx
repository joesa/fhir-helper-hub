
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/car
d";
import { User, Database, FileText, Plus } from "lucide-react";

interface PatientFormData {
  patientName: string;
  subscriberId: string;
  providerNpi: string;
  serviceLocation: string;
}

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  isLoading?: boolean;
}

const PatientForm = ({ onSubmit, isLoading }: PatientFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PatientFormData>({
    patientName: "",
    subscriberId: "",
    providerNpi: "",
    serviceLocation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).some((value) => !value)) {
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
          Patient Information
        </CardTitle>
        <CardDescription className="text-center">
          Enter the required information to create a service request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name</Label>
            <div className="relative">
              <Input
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                className="pl-10 glass-input"
                placeholder="Enter patient name"
              />
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscriberId">Subscriber ID</Label>
            <div className="relative">
              <Input
                id="subscriberId"
                name="subscriberId"
                value={formData.subscriberId}
                onChange={handleChange}
                className="pl-10 glass-input"
                placeholder="Enter subscriber ID"
              />
              <Database className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="providerNpi">Provider NPI</Label>
            <div className="relative">
              <Input
                id="providerNpi"
                name="providerNpi"
                value={formData.providerNpi}
                onChange={handleChange}
                className="pl-10 glass-input"
                placeholder="Enter provider NPI"
              />
              <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceLocation">Service Location</Label>
            <div className="relative">
              <Input
                id="serviceLocation"
                name="serviceLocation"
                value={formData.serviceLocation}
                onChange={handleChange}
                className="pl-10 glass-input"
                placeholder="Enter service location"
              />
              <Plus className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
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
