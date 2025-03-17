
interface FhirServiceConfig {
  fhirEndpoint: string;
  crdEndpoint: string;
}

interface ServiceRequestPayload {
  patientId: string;
  encounterId: string;
  conditionId: string;
  providerId: string;
  location: string;
}

export class FhirService {
  private fhirEndpoint: string;
  private crdEndpoint: string;

  constructor(config: FhirServiceConfig) {
    this.fhirEndpoint = config.fhirEndpoint;
    this.crdEndpoint = config.crdEndpoint;
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.fhirEndpoint}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/fhir+json",
        ...options.headers,
      },
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

    const response = await fetch(this.crdEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hook),
    });

    if (!response.ok) {
      throw new Error("CRD request failed");
    }

    return response.json();
  }
}

export const createFhirService = (config: FhirServiceConfig) => {
  return new FhirService(config);
};
