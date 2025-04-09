"use client"

import { useState, useEffect } from "react"
import React from "react"
import Link from "next/link"
import { ArrowLeft, Award, Brain, ChevronLeft, ChevronRight, Clock, Dices, 
  Hourglass, Info, ListTodo, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { useToast } from "~/hooks/use-toast"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"

export default function StudyDeckPage({ params }: { params: Promise<{ deck: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const deckId = resolvedParams.deck;
  
  const { toast } = useToast()
  const [flipped, setFlipped] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [studyStats, setStudyStats] = useState({
    easyCards: 0,
    hardCards: 0,
    totalReviewed: 0,
    studyStartTime: Date.now(),
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const [studyDuration, setStudyDuration] = useState(0)

  // Update the duration every second
  useEffect(() => {
    const timer = setInterval(() => {
      setStudyDuration(Math.floor((Date.now() - studyStats.studyStartTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [studyStats.studyStartTime]);
  
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(!flipped);
      } else if (e.key === 'ArrowRight' && !flipped && currentCard < totalCards - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !flipped && currentCard > 0) {
        handlePrevious();
      } else if (e.key === '1' && flipped) {
        handleCardRating('hard');
      } else if (e.key === '2' && flipped) {
        handleCardRating('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, currentCard]);

  // Show confetti effect on deck completion
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Update the card interface to include titles
  const cards = {
    "cpr-aed": [
      {
        title: "CPR Compression Rate",
        question: "What is the correct compression rate for adult CPR?",
        answer: "100-120 compressions per minute",
      },
      {
        title: "Compression Depth",
        question: "How deep should chest compressions be for an adult?",
        answer: "At least 2 inches (5 cm) but not more than 2.4 inches (6 cm)",
      },
      {
        title: "Hand Placement",
        question: "What is the correct hand placement for adult CPR?",
        answer:
          "Place the heel of one hand on the center of the chest (sternum), then place the other hand on top and interlock fingers",
      },
    ],
    "first-aid": [
      {
        title: "Severe Bleeding",
        question: "What is the first step in treating a severe bleeding wound?",
        answer: "Apply direct pressure to the wound with a clean cloth or bandage",
      },
      {
        title: "Shock Symptoms",
        question: "What are the signs of shock?",
        answer: "Pale, cold, clammy skin; rapid, weak pulse; rapid breathing; nausea; and altered mental status",
      },
      {
        title: "Burn Treatment",
        question: "How should you treat a minor burn?",
        answer:
          "Cool the burn with cool (not cold) running water for 10-15 minutes, then cover with a clean, dry bandage",
      },
    ],
    emergency: [
      {
        title: "SAMPLE Assessment",
        question: "What does the acronym SAMPLE stand for in patient assessment?",
        answer:
          "Signs/Symptoms, Allergies, Medications, Past medical history, Last oral intake, Events leading to injury/illness",
      },
      {
        title: "Primary Assessment",
        question: "What is the correct sequence for the primary assessment?",
        answer: "Check for responsiveness, call for help, check breathing and pulse, check for severe bleeding",
      },
      {
        title: "Recovery Position",
        question: "What is the recovery position and when should it be used?",
        answer:
          "A stable position where the patient lies on their side with the lower arm forward and head tilted back. Used for unconscious patients who are breathing normally and have no suspected spinal injuries.",
      },
    ],
  }

  // Get the correct deck based on the URL parameter
  const deckName = deckId as keyof typeof cards
  const currentDeck = cards[deckName] || cards["first-aid"] // Default to first-aid if deck not found

  const totalCards = currentDeck.length
  const progress = ((currentCard + 1) / totalCards) * 100
  
  // Calculate study statistics
  const accuracy = studyStats.totalReviewed > 0 
    ? Math.round((studyStats.easyCards / studyStats.totalReviewed) * 100) 
    : 0;
  
  // Format study duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFlip = () => {
    setFlipped(!flipped)
    
    if (!flipped) {
      // Only show toast when revealing the answer
      toast({
        title: "Card flipped",
        description: "Take your time to review the answer",
        variant: "info",
      })
    }
  }

  const handleCardRating = (rating: 'easy' | 'hard') => {
    // Update study statistics
    const newStats = {
      ...studyStats,
      easyCards: rating === 'easy' ? studyStats.easyCards + 1 : studyStats.easyCards,
      hardCards: rating === 'hard' ? studyStats.hardCards + 1 : studyStats.hardCards,
      totalReviewed: studyStats.totalReviewed + 1,
    }
    setStudyStats(newStats)

    // Show rating toast with different messages based on rating
    toast({
      title: rating === 'easy' ? "Marked as Easy" : "Marked as Hard",
      description: rating === 'easy' 
        ? "Great job! This card will be shown less frequently." 
        : "Don't worry! We'll show this card more often to help you learn.",
      variant: rating === 'easy' ? "success" : "warning",
    })

    // Automatically move to the next card if available
    if (currentCard < totalCards - 1) {
      handleNext()
    } else {
      // Show completion celebration
      setShowConfetti(true);
      
      // Replace toast sequence
      toast({
        title: "Saving progress",
        description: "Updating your study statistics...",
        variant: "info",
      })
      
      // Simulate saving progress
      setTimeout(() => {
        toast({
          title: "Deck completed! 🎉",
          description: `You've reviewed all ${totalCards} cards. ${newStats.easyCards} marked as easy, ${newStats.hardCards} marked as hard.`,
          variant: "success",
        })
      }, 1000)
    }
  }

  const handleNext = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(currentCard + 1)
      setFlipped(false)
      
      // If we're at the second-to-last card, show approaching end toast
      if (currentCard === totalCards - 2) {
        toast({
          title: "Last card approaching",
          description: "You're about to review the final card in this deck",
          variant: "info",
        })
      }
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
      setFlipped(false)
    }
  }

  // Show a milestone toast when reaching halfway
  const checkMilestone = (cardIndex: number) => {
    if (cardIndex === Math.floor(totalCards / 2) - 1) {
      toast({
        title: "Halfway there!",
        description: `You've completed ${Math.round(50)}% of this deck. Keep going!`,
        variant: "success",
      })
    }
  }

  // Format the deck name for display
  const formatDeckName = (name: string) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" & ")
  }

  // Get a difficulty badge based on the deck name
  const getDifficultyBadge = (deck: string) => {
    switch (deck) {
      case "cpr-aed":
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:bg-amber-700/30 dark:text-amber-400 border-amber-300">Medium</Badge>
      case "emergency":
        return <Badge variant="outline" className="bg-red-500/20 text-red-700 dark:bg-red-700/30 dark:text-red-400 border-red-300">Advanced</Badge>
      default:
        return <Badge variant="outline" className="bg-green-500/20 text-green-600 dark:bg-green-700/30 dark:text-green-400 border-green-300">Beginner</Badge>
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      {showConfetti && (
        <div className="confetti-container fixed inset-0 z-50 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                animation: `fall ${Math.random() * 3 + 2}s linear forwards, sway ${Math.random() * 4 + 3}s ease-in-out infinite alternate`
              }}
            />
          ))}
        </div>
      )}

      {/* Refined Header with improved design */}
      <header className="bg-gradient-to-r from-primary/10 via-background to-primary/10 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild className="mr-3 hover:bg-primary/10 rounded-full transition-colors">
                <Link href="/flashcards">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back to decks</span>
                </Link>
              </Button>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    {formatDeckName(deckId)}
                  </h1>
                  {getDifficultyBadge(deckId)}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Dices className="h-3.5 w-3.5 text-primary/70" />
                    Card {currentCard + 1} of {totalCards}
                  </span>
                  <span className="inline-block mx-1.5 w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                  <span>{Math.round(progress)}% complete</span>
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-5 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/40">
                <Clock className="h-4 w-4 text-primary/70" />
                <span className="font-medium">{formatDuration(studyDuration)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/40">
                <Brain className="h-4 w-4 text-primary/70" />
                <span className="font-medium">{studyStats.totalReviewed} reviewed</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/40">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{accuracy}% accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced study area with improved layout */}
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          {/* Enhanced progress tracking with better visuals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2.5 bg-card p-5 rounded-xl border shadow-md hover:shadow-lg transition-shadow dark:bg-card/80 dark:backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  Study Progress
                </span>
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-amber-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2.5 rounded-full" 
                style={{background: "linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)"}}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {totalCards - (currentCard + 1) > 0 ? (
                  <>
                    <Info className="h-3.5 w-3.5 text-primary/60" />
                    <span>{totalCards - (currentCard + 1)} cards remaining</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium">Last card!</span>
                  </>
                )}
              </p>
            </div>
            
            <div className="space-y-2.5 bg-card p-5 rounded-xl border shadow-md hover:shadow-lg transition-shadow dark:bg-card/80 dark:backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" /> 
                  Easy Cards
                </span>
                <span className="text-sm font-bold text-green-600">{studyStats.easyCards}</span>
              </div>
              <Progress value={(studyStats.easyCards / Math.max(1, studyStats.totalReviewed)) * 100} 
                className="h-2.5 rounded-full bg-muted" 
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {studyStats.totalReviewed > 0 ? (
                  <>
                    <Info className="h-3.5 w-3.5 text-primary/60" />
                    <span>{Math.round((studyStats.easyCards / studyStats.totalReviewed) * 100)}% success rate</span>
                  </>
                ) : (
                  <>
                    <Info className="h-3.5 w-3.5 text-primary/60" />
                    <span>No cards reviewed yet</span>
                  </>
                )}
              </p>
            </div>
            
            <div className="space-y-2.5 bg-card p-5 rounded-xl border shadow-md hover:shadow-lg transition-shadow dark:bg-card/80 dark:backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-primary" /> 
                  Study Time
                </span>
                <span className="text-sm font-bold">{formatDuration(studyDuration)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 mt-2.5">
                <span className="text-xs text-muted-foreground">Avg. per card:</span>
                <span className="text-xs font-medium bg-secondary/40 px-2.5 py-1 rounded-md">
                  {studyStats.totalReviewed > 0 
                    ? formatDuration(Math.floor(studyDuration / studyStats.totalReviewed)) 
                    : "0:00"}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced flashcard with improved animations and design */}
          <div className={`perspective-1000 w-full transition-all duration-300 ${flipped ? "scale-[1.02]" : ""}`}>
            <Card
              className={`
                w-full min-h-[350px] sm:min-h-[400px] md:min-h-[450px] 
                cursor-pointer transition-all duration-500 transform-style-3d relative
                hover:shadow-2xl rounded-2xl border-2 ${flipped 
                  ? "border-primary/40 shadow-lg shadow-primary/5" 
                  : "border-border hover:border-primary/20"}
                bg-gradient-to-br from-card to-card/95 overflow-hidden
              `}
              onClick={handleFlip}
            >
              {/* Abstract pattern decoration */}
              <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full bg-primary/30 blur-3xl"
                    style={{
                      width: `${Math.random() * 200 + 100}px`,
                      height: `${Math.random() * 200 + 100}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.5 + 0.25,
                      transform: `translate(-50%, -50%)`
                    }}
                  />
                ))}
              </div>

              {/* Front of card (Question) */}
              <div
                className={`absolute inset-0 w-full h-full flex flex-col backface-hidden transition-all duration-500 ${
                  flipped ? "rotate-y-180 opacity-0" : "rotate-y-0 opacity-100"
                }`}
                style={{
                  backfaceVisibility: "hidden",
                  transformStyle: "preserve-3d"
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Dices className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-sm font-medium text-primary">Question</div>
                    </div>
                    <div className="text-xs px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Card {currentCard + 1} of {totalCards}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground mt-4 pb-2 border-b">
                    {currentDeck && currentDeck[currentCard] ? currentDeck[currentCard].title : "Loading..."}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6">
                  <div className="text-lg sm:text-xl font-medium text-center max-w-2xl">
                    {currentDeck && currentDeck[currentCard] ? currentDeck[currentCard].question : "Loading..."}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-8 opacity-70">
                  <Button
                    variant="outline"
                    className="group relative overflow-hidden border-primary/30 text-primary hover:text-primary-foreground transition-colors"
                  >
                    <span className="relative z-10">Tap to Reveal Answer</span>
                    <span className="absolute inset-0 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </Button>
                </CardFooter>
                {/* Keyboard hints with improved styling */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <kbd className="text-xs border rounded-md px-2 py-0.5 bg-muted/50 shadow-sm">Space</kbd>
                </div>
              </div>

              {/* Back of card (Answer) with enhanced design */}
              <div
                className={`absolute inset-0 w-full h-full flex flex-col backface-hidden transition-all duration-500 ${
                  flipped ? "rotate-y-0 opacity-100" : "rotate-y-180 opacity-0"
                }`}
                style={{
                  backfaceVisibility: "hidden",
                  transformStyle: "preserve-3d"
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Award className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-sm font-medium text-green-600">Answer</div>
                    </div>
                    <div className="text-xs px-3.5 py-1.5 rounded-full bg-green-500/10 text-green-600 font-medium flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Card {currentCard + 1} of {totalCards}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground mt-4 pb-2 border-b">
                    {currentDeck && currentDeck[currentCard] ? currentDeck[currentCard].title : "Loading..."}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center p-6">
                  <div className="text-lg sm:text-xl font-medium text-center leading-relaxed max-w-2xl">
                    {currentDeck && currentDeck[currentCard] ? currentDeck[currentCard].answer : "Loading..."}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pb-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 w-full sm:w-auto transition-colors group"
                    onClick={() => handleCardRating('hard')}
                  >
                    <ThumbsDown className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    <span>Didn't Know It</span>
                    <span className="text-xs opacity-70 ml-1 bg-muted/50 px-1.5 rounded">1</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-green-300 text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/50 w-full sm:w-auto transition-colors group"
                    onClick={() => handleCardRating('easy')}
                  >
                    <ThumbsUp className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    <span>Knew It</span>
                    <span className="text-xs opacity-70 ml-1 bg-muted/50 px-1.5 rounded">2</span>
                  </Button>
                </CardFooter>
                {/* Keyboard hints with improved styling */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <kbd className="text-xs border rounded-md px-2 py-0.5 bg-muted/50 shadow-sm">1</kbd>
                  <kbd className="text-xs border rounded-md px-2 py-0.5 bg-muted/50 shadow-sm">2</kbd>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced navigation buttons */}
          <div className="flex justify-between mt-10 items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCard === 0}
              className="px-5 py-2.5 h-auto transition-all duration-200 hover:translate-x-[-2px] disabled:opacity-50 rounded-xl border shadow-sm"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="text-xs opacity-70 ml-1.5 hidden sm:inline bg-muted/50 px-1.5 rounded">←</span>
            </Button>
            
            <div className="text-center hidden md:block">
              <span className="text-sm font-medium bg-secondary/40 px-4 py-2 rounded-full">
                Card {currentCard + 1} of {totalCards}
              </span>
            </div>
            
            <Button
              onClick={() => {
                handleNext();
                checkMilestone(currentCard + 1);
              }}
              disabled={currentCard === totalCards - 1}
              className="px-5 py-2.5 h-auto bg-primary hover:bg-primary/90 transition-all duration-200 hover:translate-x-[2px] disabled:opacity-50 rounded-xl shadow-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="ml-2 h-4 w-4" />
              <span className="text-xs opacity-70 ml-1.5 hidden sm:inline bg-primary-foreground/20 px-1.5 rounded">→</span>
            </Button>
          </div>
          
          {/* Keyboard shortcuts guide with improved design */}
          <div className="text-xs text-center text-muted-foreground mt-6 hidden sm:block bg-muted/30 py-3 px-4 rounded-xl">
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>Keyboard shortcuts:</span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md border shadow-sm mx-1 bg-background">Space</kbd>
                <span>to flip card</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md border shadow-sm mx-1 bg-background">←</kbd>
                <span>previous card</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md border shadow-sm mx-1 bg-background">→</kbd>
                <span>next card</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md border shadow-sm mx-1 bg-background">1</kbd>
                <span>mark hard</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded-md border shadow-sm mx-1 bg-background">2</kbd>
                <span>mark easy</span>
              </span>
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sway {
          0% {
            transform: translateX(-10px);
          }
          100% {
            transform: translateX(10px);
          }
        }

        .confetti {
          position: absolute;
          border-radius: 50%;
          opacity: 0.7;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .backface-hidden {
          backface-visibility: hidden;
        }

        .rotate-y-0 {
          transform: rotateY(0deg);
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @media (prefers-reduced-motion: reduce) {
          .confetti {
            animation: none !important;
          }
          
          .backface-hidden {
            transition-duration: 0.1s !important;
          }
        }
      `}</style>
    </div>
  )
}
