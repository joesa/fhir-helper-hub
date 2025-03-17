
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { config, updateConfig } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";

const ConfigurationPanel = () => {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    FHIR_ENDPOINT: config.FHIR_ENDPOINT || "",
    FHIR_ACCESS_TOKEN: config.FHIR_ACCESS_TOKEN || "",
    CRD_ENDPOINT: config.CRD_ENDPOINT || "",
    CRD_ACCESS_TOKEN: config.CRD_ACCESS_TOKEN || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formState);
    toast({
      title: "Configuration Saved",
      description: "Your API endpoints and access tokens have been updated.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>
          Set up your FHIR and CRD service endpoints and access tokens
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">FHIR Server Configuration</h3>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="FHIR_ENDPOINT">FHIR Endpoint URL</Label>
                <Input
                  id="FHIR_ENDPOINT"
                  name="FHIR_ENDPOINT"
                  value={formState.FHIR_ENDPOINT}
                  onChange={handleChange}
                  placeholder="https://your-fhir-server-url"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="FHIR_ACCESS_TOKEN">FHIR Access Token</Label>
                <Input
                  id="FHIR_ACCESS_TOKEN"
                  name="FHIR_ACCESS_TOKEN"
                  type="password"
                  value={formState.FHIR_ACCESS_TOKEN}
                  onChange={handleChange}
                  placeholder="Enter your FHIR server access token"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">CRD Service Configuration</h3>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="CRD_ENDPOINT">CRD Endpoint URL</Label>
                <Input
                  id="CRD_ENDPOINT"
                  name="CRD_ENDPOINT"
                  value={formState.CRD_ENDPOINT}
                  onChange={handleChange}
                  placeholder="https://your-crd-server-url"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="CRD_ACCESS_TOKEN">CRD Access Token</Label>
                <Input
                  id="CRD_ACCESS_TOKEN"
                  name="CRD_ACCESS_TOKEN"
                  type="password"
                  value={formState.CRD_ACCESS_TOKEN}
                  onChange={handleChange}
                  placeholder="Enter your CRD service access token"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save Configuration</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ConfigurationPanel;
