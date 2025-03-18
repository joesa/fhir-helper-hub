import React, { useState } from "react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, Download, Upload, Table as TableIcon } from "lucide-react";
import { PatientFormData } from "@/types/patient";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ExcelUploaderProps {
  onProcess: (selectedData: PatientFormData[]) => void;
  isLoading: boolean;
}

const ExcelUploader = ({ onProcess, isLoading }: ExcelUploaderProps) => {
  const { toast } = useToast();
  const [excelData, setExcelData] = useState<PatientFormData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  
  const exampleData = [
    {
      firstName: "John",
      middleName: "",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      subscriberId: "SUB12345",
      providerNpi: "1234567890",
      organizationName: "Dr. Smith Medical Group",
      practitionerFirstName: "James",
      practitionerLastName: "Smith",
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
      organizationName: "City Medical Center",
      practitionerFirstName: "",
      practitionerLastName: "",
      diagnosisCode: "E11.9",
      cptCode: "93000"
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
        
        const formattedData = json.map((row: any) => {
          let dateOfBirth = null;
          if (row.dateOfBirth) {
            try {
              // Handle Excel date (number)
              if (typeof row.dateOfBirth === 'number') {
                // Excel dates are number of days since 1/1/1900
                // JavaScript dates are in milliseconds since 1/1/1970
                // Convert Excel date to JavaScript date
                const excelEpoch = new Date(1899, 11, 30);  // Dec 30, 1899
                const days = row.dateOfBirth;
                dateOfBirth = new Date(excelEpoch.getTime() + (days * 24 * 60 * 60 * 1000));
              } 
              // Handle date object from ExcelJS
              else if (row.dateOfBirth instanceof Date) {
                dateOfBirth = row.dateOfBirth;
              }
              // Handle string date
              else if (typeof row.dateOfBirth === 'string') {
                dateOfBirth = new Date(row.dateOfBirth);
              }
              // Handle ExcelJS date results
              else if (row.dateOfBirth && typeof row.dateOfBirth === 'object' && row.dateOfBirth.result) {
                dateOfBirth = new Date(row.dateOfBirth.result);
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
            organizationName: row.organizationName || "",
            practitionerFirstName: row.practitionerFirstName || "",
            practitionerLastName: row.practitionerLastName || "",
            diagnosisCode: row.diagnosisCode || "",
            cptCode: row.cptCode || "",
          };
        });
        
        setExcelData(formattedData);
        setSelectedRows({});
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

  const toggleSelectRow = (index: number) => {
    setSelectedRows(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleSelectAll = () => {
    if (Object.keys(selectedRows).length === excelData.length) {
      setSelectedRows({});
    } else {
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
      toast({
        title: "No Rows Selected",
        description: "Please select at least one row to process",
        variant: "destructive",
      });
      return;
    }

    // Validate each selected row
    const invalidRows: number[] = [];
    selectedData.forEach((data, index) => {
      // Check for required NPI
      if (!data.providerNpi) {
        invalidRows.push(index + 1); // +1 for human-readable row number
        return;
      }
      
      // Check for organization or practitioner
      const hasOrganization = !!data.organizationName?.trim();
      const hasPractitioner = !!(data.practitionerFirstName?.trim() && data.practitionerLastName?.trim());
      
      if (!hasOrganization && !hasPractitioner) {
        invalidRows.push(index + 1); // +1 for human-readable row number
      }
    });
    
    if (invalidRows.length > 0) {
      toast({
        title: "Invalid Data",
        description: `Rows ${invalidRows.join(', ')} are missing either Organization Name OR both Practitioner First and Last Name.`,
        variant: "destructive",
      });
      return;
    }
    
    onProcess(selectedData);
  };

  const downloadExampleTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Patients');
    
    // Add column headers
    worksheet.columns = [
      { header: 'firstName', key: 'firstName', width: 15 },
      { header: 'middleName', key: 'middleName', width: 15 },
      { header: 'lastName', key: 'lastName', width: 15 },
      { header: 'dateOfBirth', key: 'dateOfBirth', width: 15 },
      { header: 'subscriberId', key: 'subscriberId', width: 15 },
      { header: 'providerNpi', key: 'providerNpi', width: 15 },
      { header: 'organizationName', key: 'organizationName', width: 25 },
      { header: 'practitionerFirstName', key: 'practitionerFirstName', width: 20 },
      { header: 'practitionerLastName', key: 'practitionerLastName', width: 20 },
      { header: 'diagnosisCode', key: 'diagnosisCode', width: 15 },
      { header: 'cptCode', key: 'cptCode', width: 15 }
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
    a.download = 'patient_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
        
        <div className="bg-muted/30 p-4 rounded-md border border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <TableIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Expected File Format <span className="text-xs text-red-500">(NPI is required)</span></h3>
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
                  <TableHead className="font-bold">providerNpi*</TableHead>
                  <TableHead>organizationName</TableHead>
                  <TableHead>practitionerFirstName</TableHead>
                  <TableHead>practitionerLastName</TableHead>
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
                    <TableCell className="font-semibold">{row.providerNpi}</TableCell>
                    <TableCell>{row.organizationName}</TableCell>
                    <TableCell>{row.practitionerFirstName}</TableCell>
                    <TableCell>{row.practitionerLastName}</TableCell>
                    <TableCell>{row.diagnosisCode}</TableCell>
                    <TableCell>{row.cptCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {excelData.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Uploaded Data</h3>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="select-all"
                  checked={excelData.length > 0 && Object.keys(selectedRows).length === excelData.length}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-xs cursor-pointer">
                  Select All
                </label>
              </div>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Subscriber ID</TableHead>
                    <TableHead>Provider NPI</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Practitioner</TableHead>
                    <TableHead>Diagnosis Code</TableHead>
                    <TableHead>CPT Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox 
                          checked={!!selectedRows[index]}
                          onCheckedChange={() => toggleSelectRow(index)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {`${row.firstName} ${row.middleName ? row.middleName + ' ' : ''}${row.lastName}`.trim()}
                      </TableCell>
                      <TableCell>
                        {row.dateOfBirth ? format(row.dateOfBirth, 'MM/dd/yyyy') : '-'}
                      </TableCell>
                      <TableCell>{row.subscriberId || '-'}</TableCell>
                      <TableCell>{row.providerNpi || '-'}</TableCell>
                      <TableCell>{row.organizationName || '-'}</TableCell>
                      <TableCell>
                        {row.practitionerFirstName && row.practitionerLastName 
                          ? `${row.practitionerFirstName} ${row.practitionerLastName}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{row.diagnosisCode || '-'}</TableCell>
                      <TableCell>{row.cptCode || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
