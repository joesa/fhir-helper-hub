
// Configuration service for managing environment variables and app settings

interface EnvConfig {
  // FHIR Server configuration
  FHIR_ENDPOINT: string;
  FHIR_ACCESS_TOKEN?: string;
  
  // CRD Service configuration
  CRD_ENDPOINT: string;
  CRD_ACCESS_TOKEN?: string;
}

// Default configurations (used for development)
const defaultConfig: EnvConfig = {
  FHIR_ENDPOINT: "https://your-fhir-server-url",
  CRD_ENDPOINT: "https://your-crd-server-url",
};

// Attempt to load environment variables from window if in browser context
const loadEnvironmentVariables = (): EnvConfig => {
  if (typeof window !== 'undefined') {
    // Check for environment variables in localStorage
    const storedConfig = localStorage.getItem('app_config');
    if (storedConfig) {
      try {
        return { ...defaultConfig, ...JSON.parse(storedConfig) };
      } catch (error) {
        console.error('Failed to parse stored configuration:', error);
      }
    }
  }
  
  return defaultConfig;
};

// Load configuration
export const config = loadEnvironmentVariables();

// Function to update and persist configuration
export const updateConfig = (newConfig: Partial<EnvConfig>): EnvConfig => {
  const updatedConfig = { ...config, ...newConfig };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_config', JSON.stringify(updatedConfig));
  }
  
  // Update the current runtime config
  Object.assign(config, newConfig);
  
  return updatedConfig;
};
