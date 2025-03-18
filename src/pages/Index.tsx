
import React, { useState } from "react";
import PatientForm from "@/components/PatientForm";
import ResponseViewer from "@/components/ResponseViewer";
import AnimatedContainer from "@/components/AnimatedContainer";
import Hero from "@/components/Hero";
import ConfigurationPanel from "@/components/ConfigurationPanel";
import ExcelUploader from "@/components/ExcelUploader";
import BulkResponseViewer from "@/components/BulkResponseViewer";
import Icd10MappingUploader, { Icd10Mapping } from "@/components/Icd10MappingUploader";
import CptMappingUploader, { CptMapping } from "@/components/CptMappingUploader";
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
  const [icd10Mappings, setIcd10Mappings] = useState<Icd10Mapping[]>([]);
  const [cptMappings, setCptMappings] = useState<CptMapping[]>([]);

  // Create FHIR service with config - this will now use the values from config.ts
  const fhirService = createFhirService();

  const handleIcd10MappingsLoaded = (mappings: Icd10Mapping[]) => {
    setIcd10Mappings(mappings);
  };

  const handleCptMappingsLoaded = (mappings: CptMapping[]) => {
    setCptMappings(mappings);
  };

  const processServiceRequest = async (formData: PatientFormData) => {
    try {
      // Get the diagnosis display if available from mappings
      const diagnosisMapping = icd10Mappings.find(mapping => mapping.code === formData.diagnosisCode);
      const diagnosisDisplay = diagnosisMapping?.description;
      
      // Get the CPT display if available from mappings
      const cptMapping = cptMappings.find(mapping => mapping.code === formData.cptCode);
      const cptDisplay = cptMapping?.description;
      
      // Retrieve patient by subscriberId
      let patient;
      try {
        // Try to get an existing patient
        patient = await fhirService.getPatientByIdentifier(formData.subscriberId);
        console.log("Found existing patient:", patient);
      } catch (error) {
        // If not found, create a new patient
        console.log("Creating new patient...");
        
        // Construct full name from components
        const fullName = [
          formData.firstName,
          formData.middleName,
          formData.lastName
        ].filter(Boolean).join(" ");
        
        patient = await fhirService.createPatient(
          fullName,
          formData.subscriberId,
          formData.dateOfBirth
        );
      }
      
      // Retrieve or search for Organization by name
      const organization = await fhirService.getOrganizationByName(formData.providerName);
      
      // Retrieve or search for Location by name
      const location = await fhirService.getLocationByName(formData.serviceLocation);
      
      // Create Encounter
      const encounter = await fhirService.createEncounter(
        patient.id,
        location.id,
        organization.id
      );
      
      // Create Condition
      const condition = await fhirService.createCondition(
        patient.id,
        encounter.id,
        formData.diagnosisCode,
        diagnosisDisplay
      );
      
      // Get Coverage for the patient
      const coverage = await fhirService.getCoverageByPatient(patient.id);
      
      // Create ServiceRequest
      const serviceRequest = await fhirService.createServiceRequest({
        patientId: patient.id,
        encounterId: encounter.id,
        conditionId: condition.id,
        providerId: formData.providerNpi,
        providerName: formData.providerName,
        location: formData.serviceLocation,
        organizationId: organization.id,
        locationId: location.id,
        coverageId: coverage.id,
        diagnosisCode: formData.diagnosisCode,
        diagnosisDisplay: diagnosisDisplay,
        cptCode: formData.cptCode,
        cptDisplay: cptDisplay
      });
      
      // Get patient resource (full object)
      const patientResource = await fhirService.getResourceById("Patient", patient.id);
      
      // Get performer bundle
      const performerBundle = await fhirService.getPerformerBundle(serviceRequest.id);
      
      // Create CRD Order Sign with all the gathered resources
      const response = await fhirService.createCrdOrderSign(
        patient.id,
        encounter.id,
        serviceRequest.id,
        patientResource,
        coverage,
        performerBundle
      );

      return {
        success: true,
        response
      };
    } catch (error) {
      console.error("Error processing request for", formData, error);
      return {
        success: false,
        response: { error: "Failed to process request", details: (error as Error).message }
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
            <div className="flex justify-center mb-4">
              <TabsList className="w-full max-w-3xl grid-cols-6 grid gap-1">
                <TabsTrigger value="form" className="px-4 py-2">Single Request</TabsTrigger>
                <TabsTrigger value="excel" className="px-4 py-2">Excel Upload</TabsTrigger>
                <TabsTrigger value="icd10" className="px-4 py-2">ICD-10 Codes</TabsTrigger>
                <TabsTrigger value="cpt" className="px-4 py-2">CPT Codes</TabsTrigger>
                <TabsTrigger value="bulk" className="px-4 py-2">Bulk Results</TabsTrigger>
                <TabsTrigger value="config" className="px-4 py-2">Configuration</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="form" className="mt-6">
              <div className="grid gap-8">
                <PatientForm 
                  onSubmit={handleSingleSubmit} 
                  isLoading={isLoading} 
                  icd10Mappings={icd10Mappings}
                  cptMappings={cptMappings}
                />

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

            <TabsContent value="icd10" className="mt-6">
              <Icd10MappingUploader onMappingsLoaded={handleIcd10MappingsLoaded} />
            </TabsContent>

            <TabsContent value="cpt" className="mt-6">
              <CptMappingUploader onMappingsLoaded={handleCptMappingsLoaded} />
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
