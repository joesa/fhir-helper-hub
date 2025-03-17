
import { config } from "./config";

interface FhirServiceConfig {
  fhirEndpoint: string;
  crdEndpoint: string;
  fhirAccessToken?: string;
  crdAccessToken?: string;
}

interface ServiceRequestPayload {
  patientId: string;
  encounterId: string;
  conditionId: string;
  providerId: string;
  providerName: string;
  location: string;
}

export class FhirService {
  private fhirEndpoint: string;
  private crdEndpoint: string;
  private fhirAccessToken?: string;
  private crdAccessToken?: string;

  constructor(serviceConfig: FhirServiceConfig) {
    this.fhirEndpoint = serviceConfig.fhirEndpoint;
    this.crdEndpoint = serviceConfig.crdEndpoint;
    this.fhirAccessToken = serviceConfig.fhirAccessToken;
    this.crdAccessToken = serviceConfig.crdAccessToken;
  }

  private async request(path: string, options: RequestInit = {}) {
    const defaultHeaders = {
      "Content-Type": "application/fhir+json",
    };
    
    // Merge headers properly
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> || {})
    };

    // Add authorization header if access token is available
    if (this.fhirAccessToken) {
      headers["Authorization"] = `Bearer ${this.fhirAccessToken}`;
    }

    const response = await fetch(`${this.fhirEndpoint}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`FHIR request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createPatient(name: string, subscriberId: string, dateOfBirth?: Date) {
    // Split the name into parts to identify given name(s) and family name
    const nameParts = name.split(' ');
    const familyName = nameParts.pop() || ''; // Last part is the family name
    const givenNames = nameParts.length > 0 ? nameParts : [''];
    
    const patient = {
      resourceType: "Patient",
      name: [{
        use: "official",
        family: familyName,
        given: givenNames
      }],
      identifier: [{ value: subscriberId }],
      birthDate: dateOfBirth ? dateOfBirth.toISOString().slice(0, 10) : undefined, // Format as YYYY-MM-DD
    };

    return this.request("/Patient", {
      method: "POST",
      body: JSON.stringify(patient),
    });
  }

  async createEncounter(patientId: string, location: string) {
    const encounter = {
      resourceType: "Encounter",
      status: "planned",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory",
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      location: [
        {
          location: {
            display: location,
          },
        },
      ],
    };

    return this.request("/Encounter", {
      method: "POST",
      body: JSON.stringify(encounter),
    });
  }

  async createCondition(patientId: string, encounterId: string) {
    const condition = {
      resourceType: "Condition",
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
          },
        ],
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      encounter: {
        reference: `Encounter/${encounterId}`,
      },
    };

    return this.request("/Condition", {
      method: "POST",
      body: JSON.stringify(condition),
    });
  }

  async createServiceRequest(payload: ServiceRequestPayload) {
    const serviceRequest = {
      resourceType: "ServiceRequest",
      status: "draft",
      intent: "order",
      subject: {
        reference: `Patient/${payload.patientId}`,
      },
      encounter: {
        reference: `Encounter/${payload.encounterId}`,
      },
      reasonReference: [
        {
          reference: `Condition/${payload.conditionId}`,
        },
      ],
      performer: [
        {
          reference: `Practitioner/${payload.providerId}`,
          display: payload.providerName
        },
      ],
      locationReference: {
        display: payload.location,
      },
    };

    return this.request("/ServiceRequest", {
      method: "POST",
      body: JSON.stringify(serviceRequest),
    });
  }

  async createCrdOrderSign(
    serviceRequest: any,
    patient: any,
    condition: any
  ) {
    const prefetch = {
      patient,
      condition,
      serviceRequest,
    };

    const hook = {
      hook: "order-sign",
      hookInstance: "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
      fhirServer: this.fhirEndpoint,
      prefetch,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authorization header if CRD access token is available
    if (this.crdAccessToken) {
      headers["Authorization"] = `Bearer ${this.crdAccessToken}`;
    }

    const response = await fetch(this.crdEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(hook),
    });

    if (!response.ok) {
      throw new Error("CRD request failed");
    }

    return response.json();
  }
}

export const createFhirService = (serviceConfig?: Partial<FhirServiceConfig>) => {
  // Map the app config to service config format
  const defaultConfig: FhirServiceConfig = {
    fhirEndpoint: config.FHIR_ENDPOINT,
    crdEndpoint: config.CRD_ENDPOINT,
    fhirAccessToken: config.FHIR_ACCESS_TOKEN,
    crdAccessToken: config.CRD_ACCESS_TOKEN,
  };
  
  // Merge with any provided configs
  const mergedConfig: FhirServiceConfig = {
    ...defaultConfig,
    ...serviceConfig,
  };
  
  return new FhirService(mergedConfig);
};
