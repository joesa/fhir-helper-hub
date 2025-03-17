
import React from "react";
import { Zap, Shield, RefreshCw } from "lucide-react";
import AnimatedContainer from "./AnimatedContainer";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 overflow-hidden">
      <AnimatedContainer className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Streamline Healthcare Service Requests
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Simplify and accelerate your healthcare service requests with our FHIR-compliant system designed for healthcare professionals.
          </p>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium">Fast Processing</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button>Get Started</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-subtle"></div>
          <div className="relative px-7 py-6 bg-white dark:bg-gray-900 rounded-lg leading-none flex items-center">
            <code className="text-xs md:text-sm lg:text-base text-gray-800 dark:text-gray-200 overflow-auto max-h-[400px] w-full">
              {`{
  "resourceType": "ServiceRequest",
  "id": "example-servicerequest",
  "status": "active",
  "intent": "order",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "76164006",
        "display": "Biopsy of colon (procedure)"
      }
    ],
    "text": "Biopsy of colon"
  },
  "subject": {
    "reference": "Patient/example",
    "display": "John Smith"
  }
}`}
            </code>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
};

export default Hero;
