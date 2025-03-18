
import React from "react";
import { Heart, Mail, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full py-8 px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">FHIR Helper Hub</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Streamline your healthcare service requests with our FHIR-compliant system.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://hl7.org/fhir/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  FHIR Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://hl7.org/fhir/smart-app-launch/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  SMART on FHIR
                </a>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact</h3>
            <a 
              href="mailto:contact@fhirhelperhub.com" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary flex items-center"
            >
              <Mail className="mr-2 h-4 w-4" />
              contact@fhirhelperhub.com
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Exchange Manager © 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
