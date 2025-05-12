import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surveyService } from '@/lib/survey-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const SurveyPage: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => surveyService.getSurveyById(Number(surveyId)),
    enabled: !!surveyId,
  });
  
  const submitAnswersMutation = useMutation({
    mutationFn: (data: { surveyId: number; answers: Record<string, any> }) => 
      surveyService.submitSurveyAnswers(data.surveyId, data.answers),
    onSuccess: () => {
      toast.success('Survey submitted successfully!');
      navigate('/surveys/thank-you');
    },
    onError: (error) => {
      toast.error('Failed to submit survey');
      console.error('Error submitting survey:', error);
      setIsSubmitting(false);
    },
  });
  
  useEffect(() => {
    // Check if user has already completed this survey
    if (isAuthenticated && user && survey) {
      surveyService.checkSurveyCompletion(Number(surveyId), user.id)
        .then(completed => {
          if (completed) {
            toast.info('You have already completed this survey');
            navigate('/surveys');
          }
        })
        .catch(err => console.error('Error checking survey completion:', err));
    }
  }, [surveyId, user, isAuthenticated, survey, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kenya-orange"></div>
      </div>
    );
  }
  
  if (error || !survey) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-4">Survey not found</h1>
        <p className="text-kenya-brown-light mb-6">The survey you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate('/surveys')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Surveys
        </Button>
      </div>
    );
  }
  
  const questions = survey.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  const handleNextQuestion = () => {
    // Validate current question
    if (!answers[currentQuestion.id] && currentQuestion.required) {
      toast.error('Please answer this question before proceeding');
      return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitSurvey();
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleSubmitSurvey = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to submit the survey');
      return;
    }
    
    // Check if all required questions are answered
    const unansweredRequired = questions
      .filter(q => q.required)
      .find(q => !answers[q.id]);
    
    if (unansweredRequired) {
      toast.error('Please answer all required questions');
      // Find the index of the first unanswered required question
      const index = questions.findIndex(q => q.id === unansweredRequired.id);
      setCurrentQuestionIndex(index);
      return;
    }
    
    setIsSubmitting(true);
    submitAnswersMutation.mutate({
      surveyId: Number(surveyId),
      answers
    });
  };
  
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <RadioGroup 
            value={answers[currentQuestion.id] || ''} 
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 py-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'checkbox':
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option, index) => {
              const currentAnswers = answers[currentQuestion.id] || [];
              return (
                <div key={index} className="flex items-center space-x-2 py-2">
                  <Checkbox 
                    id={`checkbox-${index}`} 
                    checked={currentAnswers.includes(option)}
                    onCheckedChange={(checked) => {
                      const newAnswers = [...(answers[currentQuestion.id] || [])];
                      if (checked) {
                        newAnswers.push(option);
                      } else {
                        const optionIndex = newAnswers.indexOf(option);
                        if (optionIndex !== -1) {
                          newAnswers.splice(optionIndex, 1);
                        }
                      }
                      handleAnswerChange(currentQuestion.id, newAnswers);
                    }}
                  />
                  <Label htmlFor={`checkbox-${index}`}>{option}</Label>
                </div>
              );
            })}
          </div>
        );
        
      case 'text':
        return (
          <Textarea 
            placeholder="Type your answer here..." 
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            className="min-h-[100px]"
          />
        );
        
      case 'rating':
        const maxRating = currentQuestion.maxRating || 5;
        return (
          <div className="flex space-x-2 py-4 justify-center">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <Button
                key={rating}
                type="button"
                variant={answers[currentQuestion.id] === rating ? "default" : "outline"}
                className={`w-12 h-12 rounded-full ${answers[currentQuestion.id] === rating ? 'bg-kenya-orange text-white' : ''}`}
                onClick={() => handleAnswerChange(currentQuestion.id, rating)}
              >
                {rating}
              </Button>
            ))}
          </div>
        );
        
      default:
        return <p>Unsupported question type</p>;
    }
  };
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
          <p className="text-kenya-brown-light">{survey.description}</p>
        </div>
        
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1 text-sm text-kenya-brown-light">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-start">
              <span>{currentQuestion?.text}</span>
              {currentQuestion?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </CardTitle>
            {currentQuestion?.description && (
              <CardDescription>{currentQuestion.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {renderQuestionInput()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>
            
            <Button
              onClick={handleNextQuestion}
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : currentQuestionIndex === questions.length - 1 ? (
                <>
                  <Check size={16} />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center text-sm text-kenya-brown-light">
          <p>Your responses will be kept confidential and used only for the purposes stated in our privacy policy.</p>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
