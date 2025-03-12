
import React from "react";
import { Survey, SurveyResponse, SurveyQuestion } from "@/lib/survey-service";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface SurveyResultsSummaryProps {
  survey: Survey;
  responses: SurveyResponse[];
}

const COLORS = [
  "#9b87f5", "#33C3F0", "#F97316", "#D946EF", "#0EA5E9", 
  "#8B5CF6", "#1EAEDB", "#6E59A5", "#7E69AB", "#FEC6A1"
];

const SurveyResultsSummary: React.FC<SurveyResultsSummaryProps> = ({ survey, responses }) => {
  const isMobile = useIsMobile();
  
  if (responses.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium mb-2">No responses yet</h3>
        <p className="text-muted-foreground">Once people respond to this survey, results will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {survey.questions.map((question) => (
        <QuestionSummary 
          key={question.id} 
          question={question} 
          responses={responses}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
};

interface QuestionSummaryProps {
  question: SurveyQuestion;
  responses: SurveyResponse[];
  isMobile: boolean;
}

const QuestionSummary: React.FC<QuestionSummaryProps> = ({ question, responses, isMobile }) => {
  // Extract all answers for this question
  const answerData = getAnswerData(question, responses);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.question_text}</CardTitle>
        <CardDescription>
          {responses.length} {responses.length === 1 ? 'response' : 'responses'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderQuestionChart(question, answerData, isMobile)}
      </CardContent>
    </Card>
  );
};

// Helper function to count and format answers for a question
const getAnswerData = (question: SurveyQuestion, responses: SurveyResponse[]) => {
  const answerCounts: Record<string, number> = {};
  let totalResponded = 0;

  responses.forEach(response => {
    const answer = response.responses.find(r => r.question_id === question.id);
    if (answer) {
      totalResponded++;
      const answerValue = String(answer.answer);
      
      if (answerCounts[answerValue]) {
        answerCounts[answerValue]++;
      } else {
        answerCounts[answerValue] = 1;
      }
    }
  });

  // Format data for charts
  return {
    counts: answerCounts,
    total: totalResponded,
    chartData: Object.entries(answerCounts).map(([name, value]) => ({
      name,
      value,
      percent: Math.round((value / totalResponded) * 100)
    }))
  };
};

// Render appropriate chart based on question type
const renderQuestionChart = (
  question: SurveyQuestion, 
  answerData: { 
    counts: Record<string, number>; 
    total: number; 
    chartData: { name: string; value: number; percent: number }[] 
  },
  isMobile: boolean
) => {
  const { chartData } = answerData;

  switch (question.question_type) {
    case "multiple_choice":
      return (
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [`${value} responses (${props.payload.percent}%)`, 'Count']}
              />
              <Bar dataKey="value" fill="#9b87f5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
      
    case "yes_no":
      return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="w-full md:w-1/2">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-muted-foreground">
                    {entry.value} ({entry.percent}%)
                  </span>
                </div>
                <Progress value={entry.percent} className="h-2" />
              </div>
            ))}
          </div>
          <div className="w-full md:w-1/2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${percent}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      
    case "rating":
      // Sort ratings from 1-5
      const sortedRatings = [...chartData].sort((a, b) => Number(a.name) - Number(b.name));
      
      // Calculate average rating
      const totalRatings = sortedRatings.reduce((acc, entry) => acc + entry.value * Number(entry.name), 0);
      const totalResponses = sortedRatings.reduce((acc, entry) => acc + entry.value, 0);
      const averageRating = totalResponses > 0 ? (totalRatings / totalResponses).toFixed(1) : "0.0";
      
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
            <BarChart
              data={sortedRatings}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name, props) => [`${value} responses (${props.payload.percent}%)`, 'Count']} />
              <Bar dataKey="value" fill="#9b87f5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
      
    case "text":
      // For text responses, show a list of all answers
      const textResponses = responses
        .map(response => {
          const answer = response.responses.find(r => r.question_id === question.id);
          return answer ? String(answer.answer) : null;
        })
        .filter(answer => answer !== null) as string[];
      
      return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {textResponses.length > 0 ? (
            textResponses.map((text, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{text}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No text responses provided.</p>
          )}
        </div>
      );
      
    default:
      return <p>Unable to visualize this question type.</p>;
  }
};

export default SurveyResultsSummary;
