
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Download, Table as TableIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export interface CptMapping {
  code: string;
  description: string;
}

interface CptMappingProps {
  onMappingsLoaded: (mappings: CptMapping[]) => void;
}

const CptMappingUploader: React.FC<CptMappingProps> = ({ onMappingsLoaded }) => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<CptMapping[]>([]);

  // Example data for the format display
  const exampleData: CptMapping[] = [
    {
      code: "99213",
      description: "Office or other outpatient visit"
    },
    {
      code: "93000",
      description: "Electrocardiogram, routine"
    },
    {
      code: "80053",
      description: "Comprehensive metabolic panel"
    },
    {
      code: "71045",
      description: "X-ray exam chest 1 view"
    }
  ];

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
        
        // Transform the Excel data to match CptMapping
        const formattedData = json.map((row: any) => ({
          code: row.code || "",
          description: row.description || "",
        }));
        
        setMappings(formattedData);
        onMappingsLoaded(formattedData);
        
        toast({
          title: "CPT Codes Loaded",
          description: `Loaded ${formattedData.length} CPT codes`,
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
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CPT Codes");
    
    XLSX.writeFile(workbook, "cpt_codes_template.xlsx");
  };

  return (
    <Card className="w-full glass-panel">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg font-medium">CPT Procedure Codes</CardTitle>
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
              id="cpt-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="glass-input pl-10"
            />
            <FileSpreadsheet className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {/* Example File Format Section */}
        <div className="bg-muted/30 p-4 rounded-md border border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <TableIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Expected CPT File Format</h3>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>code</TableHead>
                  <TableHead>description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exampleData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {mappings.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{row.description}</TableCell>
                  </TableRow>
                ))}
                {mappings.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
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

export default CptMappingUploader;
