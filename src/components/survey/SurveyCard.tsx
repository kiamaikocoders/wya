
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Survey } from "@/lib/survey-service";
import { useNavigate } from "react-router-dom";

interface SurveyCardProps {
  survey: Survey;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey }) => {
  const navigate = useNavigate();
  const questionCount = survey.questions.length;
  
  const handleTakeSurvey = () => {
    navigate(`/surveys/${survey.id}`);
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl">{survey.title}</CardTitle>
        <CardDescription>
          {survey.description || "Help improve this event by taking this survey"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
          <span>
            {survey.is_anonymous ? "Anonymous responses" : "Public responses"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleTakeSurvey}>
          Take Survey
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SurveyCard;
