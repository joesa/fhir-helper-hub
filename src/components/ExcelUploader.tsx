
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, Download, Upload, Table as TableIcon } from "lucide-react";
import { PatientFormData } from "@/types/patient";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface ExcelUploaderProps {
  onProcess: (selectedData: PatientFormData[]) => void;
  isLoading: boolean;
}

const ExcelUploader = ({ onProcess, isLoading }: ExcelUploaderProps) => {
  const [excelData, setExcelData] = useState<PatientFormData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  
  // Example data for the format display
  const exampleData = [
    {
      firstName: "John",
      middleName: "",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      subscriberId: "SUB12345",
      providerNpi: "1234567890",
      providerName: "Dr. Smith Medical Group",
      serviceLocation: "Main Hospital",
      diagnosisCode: "J45.909",
      cptCode: "99213"
    },
    {
      firstName: "Jane",
      middleName: "M",
      lastName: "Smith",
      dateOfBirth: "1985-05-15",
      subscriberId: "SUB67890",
      providerNpi: "0987654321",
      providerName: "City Medical Center",
      serviceLocation: "Downtown Clinic",
      diagnosisCode: "E11.9",
      cptCode: "93000"
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
        
        // Transform the Excel data to match PatientFormData
        const formattedData = json.map((row: any) => {
          // Parse date from Excel (Excel dates are stored as serial numbers)
          let dateOfBirth = null;
          if (row.dateOfBirth) {
            try {
              // Handle different date formats
              if (typeof row.dateOfBirth === 'number') {
                // Excel date (serial number)
                dateOfBirth = XLSX.SSF.parse_date_code(row.dateOfBirth);
                dateOfBirth = new Date(dateOfBirth.y, dateOfBirth.m - 1, dateOfBirth.d);
              } else if (typeof row.dateOfBirth === 'string') {
                // Try to parse string date
                dateOfBirth = new Date(row.dateOfBirth);
              }
            } catch (error) {
              console.error("Error parsing date:", error);
            }
          }
          
          return {
            firstName: row.firstName || "",
            middleName: row.middleName || "",
            lastName: row.lastName || "",
            dateOfBirth: dateOfBirth || undefined,
            subscriberId: row.subscriberId || "",
            providerNpi: row.providerNpi || "",
            providerName: row.providerName || "",
            serviceLocation: row.serviceLocation || "",
            diagnosisCode: row.diagnosisCode || "",
            cptCode: row.cptCode || "",
          };
        });
        
        setExcelData(formattedData);
        // Reset selected rows
        setSelectedRows({});
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Error parsing Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleSelectRow = (index: number) => {
    setSelectedRows(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleSelectAll = () => {
    if (Object.keys(selectedRows).length === excelData.length) {
      // Deselect all
      setSelectedRows({});
    } else {
      // Select all
      const newSelectedRows: Record<number, boolean> = {};
      excelData.forEach((_, index) => {
        newSelectedRows[index] = true;
      });
      setSelectedRows(newSelectedRows);
    }
  };

  const handleProcessSelected = () => {
    const selectedData = excelData.filter((_, index) => selectedRows[index]);
    if (selectedData.length === 0) {
      alert("Please select at least one row to process");
      return;
    }
    onProcess(selectedData);
  };

  const downloadExampleTemplate = () => {
    const exampleData = [
      {
        firstName: "John",
        middleName: "",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        subscriberId: "SUB12345",
        providerNpi: "1234567890",
        providerName: "Dr. Smith Medical Group",
        serviceLocation: "Main Hospital",
        diagnosisCode: "J45.909",
        cptCode: "99213"
      },
      {
        firstName: "Jane",
        middleName: "M",
        lastName: "Smith",
        dateOfBirth: "1985-05-15",
        subscriberId: "SUB67890",
        providerNpi: "0987654321",
        providerName: "City Medical Center",
        serviceLocation: "Downtown Clinic",
        diagnosisCode: "E11.9",
        cptCode: "93000"
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
    
    XLSX.writeFile(workbook, "patient_template.xlsx");
  };

  return (
    <Card className="w-full glass-panel">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg font-medium">Excel Upload</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadExampleTemplate}
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
              id="excel-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="glass-input pl-10"
            />
            <FileSpreadsheet className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Button 
            onClick={handleProcessSelected} 
            disabled={isLoading || Object.keys(selectedRows).filter(k => selectedRows[Number(k)]).length === 0}
            className="whitespace-nowrap"
          >
            <Upload className="h-4 w-4 mr-2" />
            Process Selected
          </Button>
        </div>
        
        {/* Example File Format Section */}
        <div className="bg-muted/30 p-4 rounded-md border border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <TableIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Expected File Format</h3>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>firstName</TableHead>
                  <TableHead>middleName</TableHead>
                  <TableHead>lastName</TableHead>
                  <TableHead>dateOfBirth</TableHead>
                  <TableHead>subscriberId</TableHead>
                  <TableHead>providerNpi</TableHead>
                  <TableHead>providerName</TableHead>
                  <TableHead>serviceLocation</TableHead>
                  <TableHead>diagnosisCode</TableHead>
                  <TableHead>cptCode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exampleData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.middleName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>{row.dateOfBirth}</TableCell>
                    <TableCell>{row.subscriberId}</TableCell>
                    <TableCell>{row.providerNpi}</TableCell>
                    <TableCell>{row.providerName}</TableCell>
                    <TableCell>{row.serviceLocation}</TableCell>
                    <TableCell>{row.diagnosisCode}</TableCell>
                    <TableCell>{row.cptCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {excelData.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={Object.keys(selectedRows).length > 0 && 
                              Object.keys(selectedRows).length === excelData.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Subscriber ID</TableHead>
                  <TableHead>Provider Info</TableHead>
                  <TableHead>Codes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows[index] || false}
                        onCheckedChange={() => toggleSelectRow(index)}
                      />
                    </TableCell>
                    <TableCell>
                      {[row.firstName, row.middleName, row.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </TableCell>
                    <TableCell>
                      {row.dateOfBirth ? format(new Date(row.dateOfBirth), "PPP") : "N/A"}
                    </TableCell>
                    <TableCell>{row.subscriberId}</TableCell>
                    <TableCell>{row.providerName} ({row.providerNpi})</TableCell>
                    <TableCell>ICD: {row.diagnosisCode}, CPT: {row.cptCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
