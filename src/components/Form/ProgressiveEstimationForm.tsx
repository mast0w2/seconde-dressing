"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";

// ============================================================================
// Types
// ============================================================================

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  nombreVetements: number;
  valeurMoyenne: number;
  marques: string;
  description: string;
}

interface Question {
  id: string;
  question: string;
  type: "text" | "number" | "email" | "tel" | "slider" | "textarea";
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const QUESTIONS: Question[] = [
  {
    id: "nom",
    question: "Quel est votre nom ?",
    type: "text",
    placeholder: "Votre nom",
    required: true,
  },
  {
    id: "prenom",
    question: "Quel est votre prénom ?",
    type: "text",
    placeholder: "Votre prénom",
    required: true,
  },
  {
    id: "email",
    question: "Quel est votre adresse email ?",
    type: "email",
    placeholder: "votre@email.com",
    required: true,
  },
  {
    id: "telephone",
    question: "Quel est votre numéro de téléphone ?",
    type: "tel",
    placeholder: "+33 1 23 45 67 89",
    required: true,
  },  {
    id: "nombreVetements",
    question: "Combien de vêtements souhaitez-vous vendre ?",
    type: "slider",
    min: 1,
    max: 50,
    step: 1,
    unit: "",
    required: true,
  },
  {
    id: "valeurMoyenne",
    question: "Quelle est la valeur moyenne estimée par vêtement ?",
    type: "slider",
    min: 20,
    max: 500,
    step: 5,
    unit: "€",
    required: true,
  },
  {
    id: "marques",
    question: "Quelles sont les marques principales de vos vêtements ?",
    type: "text",
    placeholder: "Ex: Zara, H&M, The Kooples, Sandro, Mango, etc.",
    required: true,
  },
  {
    id: "description",
    question: "Avez-vous des informations complémentaires à nous communiquer ?",
    type: "textarea",
    placeholder: "Description ou informations supplémentaires...",
    required: false,
  },
];

const COMMISSION_RATE = 0.40;

// ============================================================================
// Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[0-9\s\-()]{10,}$/;

function validateField(field: string, value: any, type?: string): string | null {
  if (!value && value !== 0) {
    return "Ce champ est requis";
  }

  switch (type) {
    case "email":
      if (!EMAIL_REGEX.test(value)) {
        return "L'email n'est pas valide";
      }
      break;
    case "tel":
      if (!PHONE_REGEX.test(value)) {
        return "Le numéro de téléphone n'est pas valide";
      }
      break;
    case "number":
      if (value < 1) {
        return "La valeur doit être supérieure à 0";
      }
      break;
  }

  return null;
}

// ============================================================================
// API Functions
// ============================================================================

async function submitForm(data: FormData): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${data.prenom} ${data.nom}`,
        email: data.email,
        phone: data.telephone,
        subject: `Demande d'estimation - ${data.nombreVetements} vêtements`,
        message: `Estimation: ${data.nombreVetements * data.valeurMoyenne * COMMISSION_RATE}€
Marques: ${data.marques}
Description: ${data.description || "Aucune"}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, ...result };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error("[Estimation Form] Submission error:", error);
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez réessayer.",
    };
  }
}

// ============================================================================
// Component
// ============================================================================

export function ProgressiveEstimationForm() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    nombreVetements: 1,
    valeurMoyenne: 50,
    marques: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate estimation in real-time
  const estimation = formData.nombreVetements * formData.valeurMoyenne * COMMISSION_RATE;

  const currentQuestion = QUESTIONS[currentStep];

  // Handle input change
  const handleChange = (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
    
    // Clear error for current field
    if (errors[currentQuestion.id]) {
      setErrors((prev) => ({
        ...prev,
        [currentQuestion.id]: "",
      }));
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    const error = validateField(
      currentQuestion.id,
      formData[currentQuestion.id as keyof FormData],
      currentQuestion.type
    );

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [currentQuestion.id]: error,
      }));
      return false;
    }
    return true;
  };

  // Go to next step
  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      handleSubmit();
    }
  };

  // Go to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitForm(formData);

      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.message || "Impossible d'envoyer votre demande.",
          variant: "destructive",
        });
        return;
      }

      setIsComplete(true);

      toast({
        title: "Succès",
        description: "OK, on va bien vous contacter ! Merci ! Nous allons vous recontacter sous 24h pour définir votre rendez-vous.",
      });
    } catch (error) {
      console.error("[Estimation Form] Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      nombreVetements: 1,
      valeurMoyenne: 50,
      marques: "",
      description: "",
    });
    setCurrentStep(0);
    setIsComplete(false);
    setErrors({});
  };

  // Handle key press for Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNext();
    }
  };

  // Render input based on type
  const renderInput = () => {
    const value = formData[currentQuestion.id as keyof FormData];

    switch (currentQuestion.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <Input
            type={currentQuestion.type}
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentQuestion.placeholder}
            disabled={isSubmitting}
            className="w-full max-w-lg mx-auto border-2 border-noir rounded-full px-6 py-3 text-lg"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => handleChange(Number(e.target.value))}
            onKeyPress={handleKeyPress}
            placeholder={currentQuestion.placeholder}
            min={currentQuestion.min}
            disabled={isSubmitting}
            className="w-full max-w-lg mx-auto border-2 border-noir rounded-full px-6 py-3 text-lg"
          />
        );

      case "slider":
        return (
          <div className="space-y-4">
            <div onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}>
              <Slider
                value={[value as number]}
                onValueChange={(v) => handleChange(v[0])}
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                className="w-full max-w-lg mx-auto"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground max-w-lg mx-auto">
              <span>{currentQuestion.min}{currentQuestion.unit}</span>
              <span className="font-bold text-xl text-noir bg-blanc px-4 py-2 rounded-full border-2 border-noir">
                {value}{currentQuestion.unit}{value === currentQuestion.max && currentQuestion.max === 50 ? "+" : ""}
              </span>
              <span>{currentQuestion.max}{currentQuestion.unit}{currentQuestion.max === 50 ? "+" : ""}</span>
            </div>
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentQuestion.placeholder}
            disabled={isSubmitting}
            rows={4}
            className="w-full max-w-lg mx-auto p-4 border-2 border-noir rounded-3xl focus:outline-none focus:ring-2 focus:ring-vert-emeraude focus:border-transparent"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentQuestion.placeholder}
            disabled={isSubmitting}
            className="w-full max-w-lg mx-auto border-2 border-noir rounded-full px-6 py-3 text-lg"
          />
        );
    }
  };

  // Render progress indicator
  const renderProgress = () => (
    <div className="mb-8">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-vert-emeraude h-2 rounded-full"
          style={{
            width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );

  // Render estimation display (for slider step)
  const renderEstimation = () => {
    if (currentQuestion.id === "valeurMoyenne") {
      return (
        <div className="mt-6 p-4 bg-vert-tres-clair rounded-lg border border-vert-pale">
          <p className="text-sm text-muted-foreground mb-2">
            Ce que vous recevrez après commission
          </p>
          <p className="text-2xl font-bold text-vert-emeraude">
            {(formData.valeurMoyenne * COMMISSION_RATE).toFixed(0)}€
          </p>
        </div>
      );
    }
    return null;
  };

  // Render main form
  if (!isComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {renderProgress()}
        
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-600 text-noir">
            {currentQuestion.question}
          </h2>
          <div>
            {renderInput()}
          </div>
          {errors[currentQuestion.id] && (
            <p className="text-sm text-destructive">{errors[currentQuestion.id]}</p>
          )}
          {renderEstimation()}
          
          <div className="flex items-center justify-between mt-4">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="text-noir hover:text-gris-moyen transition-all text-2xl"
                aria-label="Précédent"
              >
                ←
              </button>
            )}
            <div className="flex-1"></div>
            {currentStep < QUESTIONS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="text-noir hover:text-gris-moyen transition-all text-2xl"
                aria-label="Suivant"
              >
                →
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="text-noir hover:text-gris-moyen transition-all text-2xl"
                aria-label="Envoyer"
              >
                →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render completion state
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6">
      <h2 className="text-2xl md:text-3xl font-600 text-vert-emeraude">
        Demande envoyée avec succès !
      </h2>
      <p className="text-lg">
        OK, on va bien vous contacter ! Merci ! Nous allons vous recontacter sous 24h pour définir votre rendez-vous.
      </p>
      <button
        onClick={handleReset}
        className="text-noir underline hover:no-underline transition-all text-lg"
      >
        Faire une nouvelle demande
      </button>
    </div>
  );
}

export default ProgressiveEstimationForm;
