
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Survey, SurveyResponse, surveyService } from "@/lib/survey-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SurveyResultsSummary from "@/components/survey/SurveyResultsSummary";
import SurveyResponsesList from "@/components/survey/SurveyResponsesList";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SurveyResultsPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("summary");

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ["survey", surveyId],
    queryFn: () => surveyService.getSurveyById(Number(surveyId)),
    enabled: !!surveyId,
  });

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: ["survey-responses", surveyId],
    queryFn: () => surveyService.getSurveyResponses(Number(surveyId)),
    enabled: !!surveyId,
  });

  const isLoading = surveyLoading || responsesLoading;

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">Loading survey results...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-xl mb-2">Survey not found</h2>
              <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Survey Results</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && (
            <CardDescription>{survey.description}</CardDescription>
          )}
          <div className="text-sm text-muted-foreground mt-1">
            {responses?.length || 0} responses
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="responses">Individual Responses</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <SurveyResultsSummary survey={survey} responses={responses || []} />
            </TabsContent>
            <TabsContent value="responses">
              <SurveyResponsesList survey={survey} responses={responses || []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyResultsPage;
