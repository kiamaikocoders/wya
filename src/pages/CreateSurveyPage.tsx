
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { surveyService, SurveyQuestion } from "@/lib/survey-service";
import { Trash, Plus } from "lucide-react";
import { toast } from "sonner";

type QuestionType = 'multiple_choice' | 'text' | 'rating' | 'yes_no';

const CreateSurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [questions, setQuestions] = useState<Omit<SurveyQuestion, 'id'>[]>([
    {
      question_text: "",
      question_type: "multiple_choice",
      options: [""],
      required: true
    }
  ]);

  const createSurveyMutation = useMutation({
    mutationFn: surveyService.createSurvey,
    onSuccess: () => {
      toast.success("Survey created successfully!");
      navigate(`/events/${eventId}`);
    },
    onError: (error) => {
      toast.error("Failed to create survey");
      console.error("Survey creation error:", error);
    }
  });

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "multiple_choice",
        options: [""],
        required: true
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index: number, field: keyof Omit<SurveyQuestion, 'id'>, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    
    setQuestions(newQuestions);
  };

  const handleQuestionTypeChange = (index: number, type: QuestionType) => {
    const newQuestions = [...questions];
    
    // Reset options based on question type
    let options;
    if (type === 'multiple_choice') {
      options = [""];
    } else {
      options = undefined;
    }
    
    newQuestions[index] = {
      ...newQuestions[index],
      question_type: type,
      options
    };
    
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    newQuestions[questionIndex].options = options;
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || []), ""];
    newQuestions[questionIndex].options = options;
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    
    if (options.length > 1) {
      options.splice(optionIndex, 1);
      newQuestions[questionIndex].options = options;
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      toast.error("Please enter a survey title");
      return;
    }
    
    if (!eventId) {
      toast.error("Event ID is required");
      return;
    }
    
    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} needs text`);
        return;
      }
      
      if (q.question_type === 'multiple_choice' && q.options) {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            toast.error(`Option ${j + 1} in question ${i + 1} cannot be empty`);
            return;
          }
        }
      }
    }
    
    createSurveyMutation.mutate({
      event_id: Number(eventId),
      title,
      description,
      questions,
      is_anonymous: isAnonymous
    });
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Event Survey</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter survey title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter survey description (optional)"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous">Anonymous Responses</Label>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Questions</h3>
              </div>
              
              {questions.map((question, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveQuestion(index)}
                      disabled={questions.length <= 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}`}>Question Text <span className="text-red-500">*</span></Label>
                    <Input
                      id={`question-${index}`}
                      value={question.question_text}
                      onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                      placeholder="Enter question text"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`question-type-${index}`}>Question Type</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value) => handleQuestionTypeChange(index, value as QuestionType)}
                    >
                      <SelectTrigger id={`question-type-${index}`}>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="text">Text Response</SelectItem>
                        <SelectItem value="rating">Rating (1-5)</SelectItem>
                        <SelectItem value="yes_no">Yes/No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="space-y-4">
                      <Label>Options</Label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(index, optionIndex)}
                            disabled={question.options?.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddOption(index)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Option
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id={`required-${index}`}
                      checked={question.required}
                      onCheckedChange={(checked) => handleQuestionChange(index, 'required', checked)}
                    />
                    <Label htmlFor={`required-${index}`}>Required Question</Label>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddQuestion}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSurveyMutation.isPending}>
              {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateSurveyPage;
