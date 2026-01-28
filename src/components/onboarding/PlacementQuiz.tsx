import { useState } from 'react';

import type { PlacementResult } from './types';

interface PlacementQuizProps {
  onComplete: (result: PlacementResult) => void;
  onSkip: () => void;
  onBack: () => void;
}

interface QuizQuestion {
  id: number;
  questionArabic?: string;
  questionEnglish: string;
  options: { id: string; text: string; textArabic?: string }[];
  correctId: string;
  topic: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    questionEnglish: 'What is the i\'rab of "كِتَابٌ" in: هٰذَا كِتَابٌ',
    questionArabic: 'هٰذَا كِتَابٌ',
    options: [
      { id: 'a', text: 'مرفوع (Marfoo\')' },
      { id: 'b', text: 'منصوب (Mansoob)' },
      { id: 'c', text: 'مجرور (Majroor)' },
    ],
    correctId: 'a',
    topic: 'Basic noun cases',
  },
  {
    id: 2,
    questionEnglish: 'Which verb form is "يَكْتُبُ" (he writes)?',
    questionArabic: 'يَكْتُبُ',
    options: [
      { id: 'a', text: 'Form I (فَعَلَ)' },
      { id: 'b', text: 'Form II (فَعَّلَ)' },
      { id: 'c', text: 'Form III (فَاعَلَ)' },
    ],
    correctId: 'a',
    topic: 'Verb forms',
  },
  {
    id: 3,
    questionEnglish: 'What type of word is "الْكَبِيرُ" in: الْبَيْتُ الْكَبِيرُ',
    questionArabic: 'الْبَيْتُ الْكَبِيرُ',
    options: [
      { id: 'a', text: 'مبتدأ (Subject)' },
      { id: 'b', text: 'صفة (Adjective)' },
      { id: 'c', text: 'خبر (Predicate)' },
    ],
    correctId: 'b',
    topic: 'Adjectives',
  },
  {
    id: 4,
    questionEnglish: 'In "كِتَابُ الطَّالِبِ", why is "الطَّالِبِ" majroor?',
    questionArabic: 'كِتَابُ الطَّالِبِ',
    options: [
      { id: 'a', text: 'It follows a preposition' },
      { id: 'b', text: 'It is mudaaf ilayhi (possessor)' },
      { id: 'c', text: 'It is the object of the verb' },
    ],
    correctId: 'b',
    topic: 'Idaafa constructions',
  },
  {
    id: 5,
    questionEnglish: 'What is the plural pattern of "كُتُب" (books)?',
    questionArabic: 'كُتُب',
    options: [
      { id: 'a', text: 'Sound masculine plural' },
      { id: 'b', text: 'Sound feminine plural' },
      { id: 'c', text: 'Broken plural' },
    ],
    correctId: 'c',
    topic: 'Plurals',
  },
];

export function PlacementQuiz({ onComplete, onSkip, onBack }: PlacementQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const totalQuestions = QUIZ_QUESTIONS.length;
  
  const handleAnswer = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
    
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Calculate results
      const result = calculateResult(answers, optionId);
      onComplete(result);
    }
  };
  
  const calculateResult = (
    prevAnswers: Record<number, string>, 
    lastAnswer: string
  ): PlacementResult => {
    const allAnswers = { ...prevAnswers, [currentQuestion.id]: lastAnswer };
    
    let score = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    QUIZ_QUESTIONS.forEach(q => {
      if (allAnswers[q.id] === q.correctId) {
        score++;
        strengths.push(q.topic);
      } else {
        weaknesses.push(q.topic);
      }
    });
    
    // Determine starting point based on score
    let recommendedBook: 1 | 2 | 3;
    let recommendedLesson: number;
    
    if (score <= 1) {
      recommendedBook = 1;
      recommendedLesson = 1;
    } else if (score <= 3) {
      recommendedBook = 1;
      recommendedLesson = Math.floor(score * 10);
    } else {
      recommendedBook = 2;
      recommendedLesson = (score - 3) * 5;
    }
    
    return {
      score,
      total: totalQuestions,
      recommendedBook,
      recommendedLesson,
      strengths,
      weaknesses,
    };
  };
  
  return (
    <div className="min-h-screen flex flex-col p-6 bg-[var(--color-sand-100)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          ← Back
        </button>
        <span className="text-[var(--color-ink-muted)]">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Progress bar */}
        <div className="w-full h-2 bg-[var(--color-sand-200)] rounded-full mb-8">
          <div 
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <p className="text-sm text-[var(--color-ink-muted)] mb-2">Quick Check</p>
          <h2 className="font-display text-xl font-bold text-[var(--color-ink)] mb-4">
            {currentQuestion.questionEnglish}
          </h2>
          {currentQuestion.questionArabic && (
            <p className="text-2xl font-arabic text-[var(--color-ink)]" dir="rtl">
              {currentQuestion.questionArabic}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          {currentQuestion.options.map(option => (
            <button
              key={option.id}
              onClick={() => handleAnswer(option.id)}
              className="w-full p-4 bg-[var(--color-sand-50)] border-2 border-[var(--color-sand-200)] rounded-xl
                hover:border-[var(--color-primary)] hover:bg-white
                transition-all duration-200 text-left"
            >
              <span className="text-[var(--color-ink)]">{option.text}</span>
            </button>
          ))}
          
          <button
            onClick={() => handleAnswer('skip')}
            className="w-full p-4 border-2 border-dashed border-[var(--color-sand-300)] rounded-xl
              hover:border-[var(--color-ink-muted)]
              transition-all duration-200 text-center text-[var(--color-ink-muted)]"
          >
            I don't know
          </button>
        </div>

        {/* Skip quiz */}
        <button 
          onClick={onSkip}
          className="mt-8 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          Skip quiz →
        </button>
      </div>
    </div>
  );
}
