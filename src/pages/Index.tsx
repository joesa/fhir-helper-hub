
import React, { useState } from "react";
import PatientForm from "@/components/PatientForm";
import ResponseViewer from "@/components/ResponseViewer";
import AnimatedContainer from "@/components/AnimatedContainer";
import Hero from "@/components/Hero";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import { useToast } from "@/hooks/use-toast";
import { createFhirService } from "@/lib/fhir-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [crdResponse, setCrdResponse] = useState<any>(null);

  // Create FHIR service with config - this will now use the values from config.ts
  const fhirService = createFhirService();

  const handleSubmit = async (formData: any) => {
    try {
      setIsLoading(true);

      // Construct full name from components
      const fullName = [
        formData.firstName,
        formData.middleName,
        formData.lastName
      ].filter(Boolean).join(" ");

      // Create Patient with name components and DOB
      const patient = await fhirService.createPatient(
        fullName,
        formData.subscriberId,
        formData.dateOfBirth
      );

      // Create Encounter
      const encounter = await fhirService.createEncounter(
        patient.id,
        formData.serviceLocation
      );

      // Create Condition
      const condition = await fhirService.createCondition(
        patient.id,
        encounter.id
      );

      // Create ServiceRequest
      const serviceRequest = await fhirService.createServiceRequest({
        patientId: patient.id,
        encounterId: encounter.id,
        conditionId: condition.id,
        providerId: formData.providerNpi,
        location: formData.serviceLocation,
      });

      // Create CRD Order Sign
      const response = await fhirService.createCrdOrderSign(
        serviceRequest,
        patient,
        condition
      );

      setCrdResponse(response);
      toast({
        title: "Success",
        description: "Service request created successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Hero />
      <div className="py-12 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <AnimatedContainer className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">
              Create Your Service Request
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Fill out the form below to generate FHIR-compliant service requests
            </p>
          </div>

          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="form">Service Request</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-6">
              <div className="grid gap-8">
                <PatientForm onSubmit={handleSubmit} isLoading={isLoading} />

                {crdResponse && (
                  <ResponseViewer
                    response={crdResponse}
                    title="CRD Order Sign Response"
                  />
                )}
              </div>
            </TabsContent>
            <TabsContent value="config" className="mt-6">
              <ConfigurationPanel />
            </TabsContent>
          </Tabs>
        </AnimatedContainer>
      </div>
    </>
  );
};

export default Index;
