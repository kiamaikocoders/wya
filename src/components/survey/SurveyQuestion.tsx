
import React from "react";
import { SurveyQuestion as SurveyQuestionType } from "@/lib/survey-service";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SurveyQuestionProps {
  question: SurveyQuestionType;
  value: string | string[] | number | undefined;
  onChange: (questionId: number, value: string | string[] | number) => void;
}

const SurveyQuestion: React.FC<SurveyQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  const handleChange = (val: string | string[] | number) => {
    onChange(question.id, val);
  };

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <h3 className="text-lg font-medium">
          {question.question_text}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>

      {question.question_type === "multiple_choice" && question.options && (
        <RadioGroup
          value={value as string}
          onValueChange={handleChange}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${question.id}-${index}`} />
              <Label htmlFor={`option-${question.id}-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.question_type === "text" && (
        <Textarea
          value={value as string || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter your answer"
          className="w-full"
        />
      )}

      {question.question_type === "rating" && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              type="button"
              variant={Number(value) === rating ? "default" : "outline"}
              onClick={() => handleChange(rating)}
              className="w-10 h-10 rounded-full"
            >
              {rating}
            </Button>
          ))}
        </div>
      )}

      {question.question_type === "yes_no" && (
        <div className="flex gap-4">
          <Button
            type="button"
            variant={value === "Yes" ? "default" : "outline"}
            onClick={() => handleChange("Yes")}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={value === "No" ? "default" : "outline"}
            onClick={() => handleChange("No")}
          >
            No
          </Button>
        </div>
      )}
    </div>
  );
};

export default SurveyQuestion;
