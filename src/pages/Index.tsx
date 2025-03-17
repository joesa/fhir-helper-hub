
import React, { useState } from "react";
import PatientForm from "@/components/PatientForm";
import ResponseViewer from "@/components/ResponseViewer";
import AnimatedContainer from "@/components/AnimatedContainer";
import Hero from "@/components/Hero";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ExcelUploader from "@/components/ExcelUploader";
import BulkResponseViewer from "@/components/BulkResponseViewer";
import { useToast } from "@/hooks/use-toast";
import { createFhirService } from "@/lib/fhir-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PatientFormData } from "@/types/patient";

interface ProcessedResponse {
  patientData: PatientFormData;
  response: any;
  success: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [crdResponse, setCrdResponse] = useState<any>(null);
  const [bulkResponses, setBulkResponses] = useState<ProcessedResponse[]>([]);
  const [activeTab, setActiveTab] = useState<string>("form");

  // Create FHIR service with config - this will now use the values from config.ts
  const fhirService = createFhirService();

  const processServiceRequest = async (formData: PatientFormData) => {
    try {
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
        providerName: formData.providerName,
        location: formData.serviceLocation,
      });

      // Create CRD Order Sign
      const response = await fhirService.createCrdOrderSign(
        serviceRequest,
        patient,
        condition
      );

      return {
        success: true,
        response
      };
    } catch (error) {
      console.error("Error processing request for", formData, error);
      return {
        success: false,
        response: { error: "Failed to process request" }
      };
    }
  };

  const handleSingleSubmit = async (formData: PatientFormData) => {
    setIsLoading(true);
    try {
      const result = await processServiceRequest(formData);
      setCrdResponse(result.response);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Service request created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process request",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async (selectedData: PatientFormData[]) => {
    setIsLoading(true);
    setBulkResponses([]);
    
    const results: ProcessedResponse[] = [];
    
    try {
      // Process each selected row
      for (const formData of selectedData) {
        try {
          const result = await processServiceRequest(formData);
          results.push({
            patientData: formData,
            response: result.response,
            success: result.success
          });
        } catch (error) {
          results.push({
            patientData: formData,
            response: { error: "Failed to process request" },
            success: false
          });
        }
      }
      
      setBulkResponses(results);
      
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        toast({
          title: `Processed ${results.length} requests`,
          description: `Successfully processed ${successCount} of ${results.length} requests`,
        });
      } else {
        toast({
          title: "Bulk processing failed",
          description: "Failed to process any requests successfully",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      // Switch to the bulk results tab
      setActiveTab("bulk");
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
              Fill out the form below or upload an Excel spreadsheet to generate FHIR-compliant service requests
            </p>
          </div>

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
              <TabsTrigger value="form">Single Request</TabsTrigger>
              <TabsTrigger value="excel">Excel Upload</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Results</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="mt-6">
              <div className="grid gap-8">
                <PatientForm onSubmit={handleSingleSubmit} isLoading={isLoading} />

                {crdResponse && (
                  <ResponseViewer
                    response={crdResponse}
                    title="CRD Order Sign Response"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="excel" className="mt-6">
              <ExcelUploader onProcess={handleBulkSubmit} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              {bulkResponses.length > 0 ? (
                <BulkResponseViewer responses={bulkResponses} />
              ) : (
                <div className="text-center p-8 border rounded-lg bg-white dark:bg-gray-800">
                  <p className="text-gray-500 dark:text-gray-400">
                    No bulk processing results yet. Upload and process an Excel file to see results here.
                  </p>
                </div>
              )}
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
