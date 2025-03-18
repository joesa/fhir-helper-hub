import React, { useState } from "react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Download, Table as TableIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export interface Icd10Mapping {
  code: string;
  description: string;
}

interface Icd10MappingProps {
  onMappingsLoaded: (mappings: Icd10Mapping[]) => void;
}

const Icd10MappingUploader = ({ onMappingsLoaded }: Icd10MappingProps) => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<Icd10Mapping[]>([]);

  // Example data for the format display
  const exampleData: Icd10Mapping[] = [
    {
      code: "J45.909",
      description: "Asthma, unspecified"
    },
    {
      code: "E11.9",
      description: "Type 2 diabetes mellitus without complications"
    },
    {
      code: "I10",
      description: "Essential (primary) hypertension"
    },
    {
      code: "F41.9",
      description: "Anxiety disorder, unspecified"
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(event.target?.result as ArrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error("No worksheet found in the Excel file");
        }
        
        const json: any[] = [];
        const headers: string[] = [];
        
        // Extract headers from the first row
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || '';
        });
        
        // Extract data rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          
          json.push(rowData);
        });
        
        // Transform the Excel data to match Icd10Mapping
        const formattedData = json.map((row: any) => ({
          code: row.code?.toString() || "",
          description: row.description?.toString() || "",
        }));
        
        setMappings(formattedData);
        onMappingsLoaded(formattedData);
        
        toast({
          title: "ICD-10 Codes Loaded",
          description: `Loaded ${formattedData.length} ICD-10 codes`,
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

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ICD-10 Codes');
    
    // Add column headers
    worksheet.columns = [
      { header: 'code', key: 'code', width: 15 },
      { header: 'description', key: 'description', width: 50 }
    ];
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add example data
    exampleData.forEach(data => {
      worksheet.addRow(data);
    });
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create a blob from the buffer
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create a download link and trigger click
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'icd10_codes_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Card className="w-full glass-panel">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg font-medium">ICD-10 Diagnosis Codes</CardTitle>
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
              id="icd10-upload"
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
            <h3 className="text-sm font-medium">Expected ICD-10 File Format</h3>
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

export default Icd10MappingUploader;
