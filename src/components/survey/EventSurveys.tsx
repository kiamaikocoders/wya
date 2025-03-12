
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { surveyService } from "@/lib/survey-service";
import { Button } from "@/components/ui/button";
import SurveyCard from "./SurveyCard";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface EventSurveysProps {
  eventId: number;
}

const EventSurveys: React.FC<EventSurveysProps> = ({ eventId }) => {
  const { user } = useAuth();
  
  const { data: surveys, isLoading, error } = useQuery({
    queryKey: ["eventSurveys", eventId],
    queryFn: () => surveyService.getSurveysByEventId(eventId),
  });

  if (isLoading) {
    return <div className="py-4">Loading surveys...</div>;
  }

  if (error) {
    return <div className="py-4 text-red-500">Error loading surveys</div>;
  }

  if (surveys?.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-muted-foreground mb-4">No surveys available for this event yet.</p>
        {user && (
          <Link to={`/events/${eventId}/create-survey`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Survey
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Event Surveys</h3>
        {user && (
          <Link to={`/events/${eventId}/create-survey`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Create Survey
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {surveys?.map((survey) => (
          <SurveyCard key={survey.id} survey={survey} />
        ))}
      </div>
    </div>
  );
};

export default EventSurveys;
