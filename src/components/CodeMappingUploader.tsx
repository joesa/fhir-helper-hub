
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CodeMapping {
  code: string;
  description: string;
  type: "ICD10" | "CPT";
}

interface CodeMappingProps {
  onMappingsLoaded: (mappings: CodeMapping[]) => void;
}

const CodeMappingUploader: React.FC<CodeMappingProps> = ({ onMappingsLoaded }) => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<CodeMapping[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        // Transform the Excel data to match CodeMapping
        const formattedData = json.map((row: any) => ({
          code: row.code || "",
          description: row.description || "",
          type: row.type || "ICD10",
        }));
        
        setMappings(formattedData);
        onMappingsLoaded(formattedData);
        
        toast({
          title: "Code Mappings Loaded",
          description: `Loaded ${formattedData.length} code mappings`,
        });
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast({
          title: "Error",
          description: "Error parsing Excel file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const exampleData = [
      {
        code: "J45.909",
        description: "Asthma, unspecified",
        type: "ICD10"
      },
      {
        code: "E11.9",
        description: "Type 2 diabetes mellitus without complications",
        type: "ICD10"
      },
      {
        code: "99213",
        description: "Office or other outpatient visit",
        type: "CPT"
      },
      {
        code: "93000",
        description: "Electrocardiogram, routine",
        type: "CPT"
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Code Mappings");
    
    XLSX.writeFile(workbook, "code_mappings_template.xlsx");
  };

  return (
    <Card className="w-full glass-panel">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg font-medium">Code Mappings</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              id="mapping-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="glass-input pl-10"
            />
            <FileSpreadsheet className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {mappings.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.description}</TableCell>
                  </TableRow>
                ))}
                {mappings.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      And {mappings.length - 5} more...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeMappingUploader;
