
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import AnimatedContainer from "./AnimatedContainer";

interface ResponseViewerProps {
  response: any;
  title: string;
}

const ResponseViewer = ({ response, title }: ResponseViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <AnimatedContainer animation="slide-up" className="w-full max-w-4xl mx-auto">
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={cn(
            "overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-[500px]" : "max-h-20"
          )}
        >
          <pre
            className={cn(
              "text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto",
              !isExpanded && "line-clamp-2"
            )}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
};

export default ResponseViewer;
