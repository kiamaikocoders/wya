
import React from "react";
import { Survey, SurveyResponse } from "@/lib/survey-service";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SurveyResponsesListProps {
  survey: Survey;
  responses: SurveyResponse[];
}

const SurveyResponsesList: React.FC<SurveyResponsesListProps> = ({ survey, responses }) => {
  if (responses.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium mb-2">No responses yet</h3>
        <p className="text-muted-foreground">Once people respond to this survey, individual responses will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {responses.map((response, index) => (
          <ResponseItem 
            key={response.id} 
            response={response} 
            survey={survey} 
            index={index} 
          />
        ))}
      </Accordion>
    </div>
  );
};

interface ResponseItemProps {
  response: SurveyResponse;
  survey: Survey;
  index: number;
}

const ResponseItem: React.FC<ResponseItemProps> = ({ response, survey, index }) => {
  // Format the submission date
  const formattedDate = format(
    new Date(response.submitted_at), 
    "MMM d, yyyy 'at' h:mm a"
  );
  
  return (
    <AccordionItem value={`response-${response.id}`} className="border rounded-lg mb-4">
      <AccordionTrigger className="px-4 py-2 hover:no-underline">
        <div className="flex items-center justify-between w-full">
          <div className="text-left">
            <h3 className="font-medium">Response #{index + 1}</h3>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          {response.user_id && !survey.is_anonymous && (
            <div className="text-sm text-muted-foreground">
              User ID: {response.user_id}
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4 mt-2">
          {survey.questions.map(question => {
            const answer = response.responses.find(
              r => r.question_id === question.id
            );
            
            return (
              <div key={question.id} className="border-b pb-3 last:border-0">
                <h4 className="font-medium mb-1">
                  {question.question_text}
                </h4>
                <div className="text-sm">
                  {answer ? (
                    <ResponseValue 
                      answer={answer.answer} 
                      questionType={question.question_type} 
                    />
                  ) : (
                    <span className="text-muted-foreground italic">No answer provided</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface ResponseValueProps {
  answer: string | string[] | number;
  questionType: 'multiple_choice' | 'text' | 'rating' | 'yes_no';
}

const ResponseValue: React.FC<ResponseValueProps> = ({ answer, questionType }) => {
  if (answer === null || answer === undefined) {
    return <span className="text-muted-foreground italic">No answer</span>;
  }

  switch (questionType) {
    case 'rating':
      return (
        <div className="flex items-center">
          <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mr-2">
            {answer}
          </span>
          <span>out of 5</span>
        </div>
      );
      
    case 'yes_no':
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          answer === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {String(answer)}
        </span>
      );
      
    case 'text':
      return <p className="whitespace-pre-wrap">{String(answer)}</p>;
      
    case 'multiple_choice':
    default:
      return <p>{String(answer)}</p>;
  }
};

export default SurveyResponsesList;
