
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Survey, QuestionResponse, surveyService } from "@/lib/survey-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SurveyQuestion from "@/components/survey/SurveyQuestion";
import { toast } from "sonner";

const SurveyPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Map<number, string | string[] | number>>(new Map());
  const [formError, setFormError] = useState<string | null>(null);

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ["survey", surveyId],
    queryFn: () => surveyService.getSurveyById(Number(surveyId)),
    enabled: !!surveyId,
  });

  const submitMutation = useMutation({
    mutationFn: surveyService.submitSurveyResponse,
    onSuccess: () => {
      toast.success("Survey response submitted successfully!");
      navigate(-1); // Go back to previous page
    },
    onError: (error) => {
      toast.error("Failed to submit survey response");
      console.error("Survey submission error:", error);
    },
  });

  const handleResponseChange = (questionId: number, value: string | string[] | number) => {
    setResponses(new Map(responses.set(questionId, value)));
  };

  const validateResponses = () => {
    if (!survey) return false;
    
    const requiredQuestions = survey.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!responses.has(question.id)) {
        setFormError(`Please answer all required questions`);
        return false;
      }
    }
    
    setFormError(null);
    return true;
  };

  const handleSubmit = () => {
    if (!survey || !validateResponses()) return;
    
    const formattedResponses: Omit<QuestionResponse, 'id'>[] = 
      Array.from(responses.entries()).map(([question_id, answer]) => ({
        question_id,
        answer
      }));
    
    submitMutation.mutate({
      survey_id: survey.id,
      responses: formattedResponses
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">Loading survey...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <h2 className="text-xl mb-2">Error loading survey</h2>
              <p>The survey could not be found or has been removed.</p>
              <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{survey.title}</CardTitle>
          {survey.description && (
            <CardDescription className="text-lg">{survey.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {survey.questions.map((question) => (
            <SurveyQuestion
              key={question.id}
              question={question}
              value={responses.get(question.id)}
              onChange={handleResponseChange}
            />
          ))}
          
          {formError && (
            <div className="text-red-500 mb-4">{formError}</div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Response"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SurveyPage;
