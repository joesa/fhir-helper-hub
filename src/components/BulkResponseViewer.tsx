
import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ResponseViewer from "@/components/ResponseViewer";
import { cn } from "@/lib/utils";
import { PatientFormData } from "@/types/patient";

interface ProcessedResponse {
  patientData: PatientFormData;
  response: any;
  success: boolean;
}

interface BulkResponseViewerProps {
  responses: ProcessedResponse[];
}

const BulkResponseViewer = ({ responses }: BulkResponseViewerProps) => {
  const [openItems, setOpenItems] = React.useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto">
      <h3 className="text-lg font-medium text-center mb-4">
        Processed {responses.length} request{responses.length !== 1 ? 's' : ''}
      </h3>
      
      {responses.map((item, index) => {
        const isOpen = openItems[index];
        const patientName = [
          item.patientData.firstName,
          item.patientData.middleName,
          item.patientData.lastName
        ].filter(Boolean).join(" ");
        
        // Determine provider info based on whether organization or practitioner info is available
        let providerInfo = "No provider information";
        if (item.patientData.organizationName) {
          providerInfo = `${item.patientData.organizationName} (${item.patientData.providerNpi || 'No NPI'})`;
        } else if (item.patientData.practitionerFirstName || item.patientData.practitionerLastName) {
          const practitionerName = [
            item.patientData.practitionerFirstName,
            item.patientData.practitionerLastName
          ].filter(Boolean).join(" ");
          providerInfo = `${practitionerName} (${item.patientData.providerNpi || 'No NPI'})`;
        }
        
        return (
          <Collapsible
            key={index}
            open={isOpen}
            onOpenChange={() => toggleItem(index)}
            className="w-full"
          >
            <Card className={cn(
              "glass-panel overflow-hidden border",
              item.success ? "border-green-200" : "border-red-200"
            )}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">
                      Patient: {patientName}
                    </span>
                    <span className="text-sm text-gray-500">
                      Provider: {providerInfo}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={cn(
                      "text-sm mr-4 px-2 py-1 rounded-full",
                      item.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      {item.success ? "Success" : "Failed"}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Separator />
                <CardContent className="pt-4">
                  <ResponseViewer 
                    response={item.response} 
                    title={`Response for ${patientName}`} 
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default BulkResponseViewer;
