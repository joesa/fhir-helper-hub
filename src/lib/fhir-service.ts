
import { config } from "./config";
import { format, parseISO, addDays } from "date-fns";

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
  practitionerId?: string;
  providerType: 'organization' | 'practitioner';
  organizationName?: string;
  practitionerFirstName?: string;
  practitionerLastName?: string;
  locationId: string;
  coverageId: string;
  diagnosisCode?: string;
  diagnosisDisplay?: string;
  cptCode?: string;
  cptDisplay?: string;
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
    
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> || {})
    };

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

  async getPatientByIdentifier(subscriberId: string) {
    const result = await this.request(`/Patient?identifier=${subscriberId}`);
    
    if (!result.entry || result.entry.length === 0) {
      throw new Error(`Patient not found with identifier: ${subscriberId}`);
    }
    
    return result.entry[0].resource;
  }

  async getOrganizationByName(organizationName: string) {
    const result = await this.request(`/Organization?name=${encodeURIComponent(organizationName)}`);
    
    if (!result.entry || result.entry.length === 0) {
      throw new Error(`Organization not found with name: ${organizationName}`);
    }
    
    return result.entry[0].resource;
  }

  async getPractitionerByNpi(npi: string) {
    const result = await this.request(`/Practitioner?identifier=${encodeURIComponent(npi)}`);
    
    if (!result.entry || result.entry.length === 0) {
      throw new Error(`Practitioner not found with NPI: ${npi}`);
    }
    
    return result.entry[0].resource;
  }

  async getLocationByName(locationName: string) {
    const result = await this.request(`/Location?name=${encodeURIComponent(locationName)}`);
    
    if (!result.entry || result.entry.length === 0) {
      throw new Error(`Location not found with name: ${locationName}`);
    }
    
    return result.entry[0].resource;
  }

  async getCoverageByPatient(patientId: string) {
    const result = await this.request(`/Coverage?patient=${patientId}`);
    
    if (!result.entry || result.entry.length === 0) {
      throw new Error(`Coverage not found for patient: ${patientId}`);
    }
    
    return result.entry[0].resource;
  }

  async getResourceById(resourceType: string, id: string) {
    return this.request(`/${resourceType}/${id}`);
  }

  async createEncounter(patientId: string, locationId: string, providerId: string, providerType: 'organization' | 'practitioner') {
    const currentDateTime = new Date().toISOString();
    
    const encounter = {
      resourceType: "Encounter",
      id: "another_test2",
      status: "in-progress",
      class: {
        code: "AMB",
        display: "Ambulatory"
      },
      type: [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "2",
              display: "Established"
            }
          ],
          text: "Established"
        }
      ],
      subject: {
        reference: `Patient/${patientId}`
      },
      participant: [
        {
          type: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                  code: "ADM",
                  display: "admitter"
                }
              ]
            }
          ],
          period: {
            start: currentDateTime
          },
          individual: {
            reference: "Practitioner/519c7de7-95ef-11ef-b79d-0280bad11495"
          }
        }
      ],
      period: {
        start: currentDateTime
      },
      location: [
        {
          location: {
            reference: `Location/${locationId}`
          }
        }
      ],
      serviceProvider: {
        reference: providerType === 'organization' 
          ? `Organization/${providerId}` 
          : `Practitioner/${providerId}`
      }
    };

    return this.request("/Encounter", {
      method: "POST",
      body: JSON.stringify(encounter),
    });
  }

  async createCondition(patientId: string, encounterId: string, diagnosisCode?: string, diagnosisDisplay?: string) {
    const currentDateTime = new Date().toISOString();
    
    const condition = {
      resourceType: "Condition",
      id: "someConditionId",
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active"
          }
        ],
        text: "Active"
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed",
            display: "Confirmed"
          }
        ],
        text: "Confirmed"
      },
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10-cm",
            code: diagnosisCode,
            display: diagnosisDisplay || diagnosisCode
          }
        ],
        text: diagnosisDisplay || diagnosisCode
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      encounter: {
        reference: `Encounter/${encounterId}`
      },
      onsetDateTime: currentDateTime
    };

    return this.request("/Condition", {
      method: "POST",
      body: JSON.stringify(condition),
    });
  }

  async createServiceRequest(payload: ServiceRequestPayload) {
    const currentDate = new Date();
    const formattedCurrentDate = format(currentDate, "yyyy-MM-dd");
    
    // Generate random period for occurrence
    const startDateTime = currentDate.toISOString();
    const endDateTime = addDays(currentDate, Math.floor(Math.random() * 5) + 1).toISOString();
    
    const serviceRequest = {
      resourceType: "ServiceRequest",
      id: "someServiceRequestId",
      extension: [
        {
          url: "http://hl7.org/fhir/us/davinci-crd/StructureDefinition/ext-coverage-information",
          extension: [
            {
              url: "covered",
              valueCode: "covered"
            },
            {
              url: "pa-needed",
              valueCode: "auth-needed"
            },
            {
              url: "doc-needed",
              valueCode: "clinical"
            },
            {
              url: "coverage",
              valueReference: {
                reference: `Coverage/${payload.coverageId}`
              }
            },
            {
              url: "date",
              valueDate: formattedCurrentDate
            },
            {
              url: "coverage-assertion-id",
              valueString: "75bef586-7896-490d-80bb-22012c09e300"
            },
            {
              url: "billingCode",
              valueCoding: {
                system: "CPT",
                code: payload.cptCode,
                display: payload.cptCode
              }
            }
          ]
        }
      ],
      status: "active",
      intent: "order",
      category: [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "387713003",
              display: "Surgical Procedure"
            }
          ],
          text: "Surgical Procedure"
        }
      ],
      priority: "routine",
      code: {
        coding: [
          {
            system: "http://www.ama-assn.org/go/cpt",
            code: payload.cptCode,
            display: payload.cptDisplay || payload.cptCode
          }
        ],
        text: payload.cptDisplay || payload.cptCode
      },
      orderDetail: [
        {
          coding: [
            {
              system: "https://x12.org/codes/service-type-codes",
              code: "3",
              display: "Consultation\n"
            }
          ],
          text: "Consultation\n"
        }
      ],
      quantityQuantity: {
        value: 1
      },
      subject: {
        reference: `Patient/${payload.patientId}`
      },
      encounter: {
        reference: `Encounter/${payload.encounterId}`
      },
      occurrencePeriod: {
        start: startDateTime,
        end: endDateTime
      },
      authoredOn: formattedCurrentDate,
      performer: [
        {
          reference: payload.providerType === 'organization'
            ? `Organization/${payload.providerId}`
            : `Practitioner/${payload.providerId}`
        }
      ],
      reasonReference: [
        {
          reference: `Condition/${payload.conditionId}`
        }
      ],
      insurance: [
        {
          reference: `Coverage/${payload.coverageId}`
        }
      ]
    };

    return this.request("/ServiceRequest", {
      method: "POST",
      body: JSON.stringify(serviceRequest),
    });
  }

  async getPerformerBundle(serviceRequestId: string) {
    const url = `/ServiceRequest?_id=${serviceRequestId}&_include=ServiceRequest%3Aperformer&_include=ServiceRequest%3AlocationReference&_include=ServiceRequest%3AreasonReference&_include%3Aiterate=PractitionerRole%3Apractitioner&_include%3Aiterate=PractitionerRole%3Alocation`;
    return this.request(url);
  }

  async createCrdOrderSign(
    patientId: string,
    encounterId: string,
    serviceRequestId: string,
    patientResource: any,
    coverageResource: any,
    performerBundle: any
  ) {
    const serviceRequest = await this.getResourceById("ServiceRequest", serviceRequestId);
    
    const hook = {
      context: {
        patientId: `Patient/${patientId}`,
        encounterId: `Encounter/${encounterId}`,
        draftOrders: {
          entry: [
            {
              resource: serviceRequest,
            },
          ],
          type: "collection",
          resourceType: "Bundle",
        },
      },
      hook: "order-sign",
      hookInstance: "uwyey3wywsh22737h2sw2",
      fhirAuthorization: {
        token_type: "Bearer",
        subject: "cds-service",
        access_token: this.fhirAccessToken || "someToken",
      },
      fhirServer: this.fhirEndpoint,
      prefetch: {
        "coverage": coverageResource,
        "performer": performerBundle,
        "patient": patientResource
      }
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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
  const defaultConfig: FhirServiceConfig = {
    fhirEndpoint: config.FHIR_ENDPOINT,
    crdEndpoint: config.CRD_ENDPOINT,
    fhirAccessToken: config.FHIR_ACCESS_TOKEN,
    crdAccessToken: config.CRD_ACCESS_TOKEN,
  };
  
  const mergedConfig: FhirServiceConfig = {
    ...defaultConfig,
    ...serviceConfig,
  };
  
  return new FhirService(mergedConfig);
};
