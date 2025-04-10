"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  HelpCircle, 
  Tag, 
  Image as ImageIcon, 
  Pencil, 
  LayoutTemplate, 
  X, 
  Plus,
  Eye
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "~/components/ui/dialog";

export default function CreateFlashcard() {
  const router = useRouter();
  const { toast } = useToast();
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    title: "",
    imageUrl: "",
    tags: [] as string[],
    deckId: "",
  });
  
  // Fetch decks from API
  const { data: decks, isLoading: loadingDecks } = api.flashcard.getDecks.useQuery();
  
  // Form validation errors
  const [errors, setErrors] = useState({
    question: "",
    answer: "",
    imageUrl: "",
  });
  
  const [tagInput, setTagInput] = useState("");
  const [isImageValid, setIsImageValid] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [flipCard, setFlipCard] = useState(false);
  const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDescription, setNewDeckDescription] = useState("");
  
  // Check image validity
  useEffect(() => {
    if (formData.imageUrl) {
      const img = new Image();
      img.onload = () => setIsImageValid(true);
      img.onerror = () => setIsImageValid(false);
      img.src = formData.imageUrl;
    }
  }, [formData.imageUrl]);
  
  // tRPC mutations
  const createFlashcard = api.flashcard.createFlashcard.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your flashcard has been created.",
        variant: "default",
      });
      router.push("/flashcards");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create flashcard. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const createDeck = api.flashcard.createDeck.useMutation({
    onSuccess: (newDeck) => {
      toast({
        title: "Deck Created!",
        description: `Your deck "${newDeck.name}" has been created.`,
        variant: "default",
      });
      
      // Update form to select the new deck
      setFormData(prev => ({
        ...prev,
        deckId: newDeck.id,
      }));
      
      // Reset form fields
      setNewDeckName("");
      setNewDeckDescription("");
      
      // Close the dialog
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLElement;
      if (closeButton) closeButton.click();
      
      // Refetch decks
      utils.flashcard.getDecks.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deck. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // tRPC utils for invalidating queries
  const utils = api.useUtils();
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  
  // Handle tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  };
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      setTagInput("");
      setTimeout(() => {
        if (tagInputRef.current) {
          tagInputRef.current.focus();
        }
      }, 0);
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {
      question: "",
      answer: "",
      imageUrl: "",
    };
    
    let isValid = true;
    
    if (!formData.question.trim()) {
      newErrors.question = "Question is required";
      isValid = false;
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = "Answer is required";
      isValid = false;
    }
    
    // Only validate URL if a value is provided
    if (formData.imageUrl && formData.imageUrl.trim() !== "" && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = "Please enter a valid URL";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Update isValidUrl to be more robust
  const isValidUrl = (url: string) => {
    if (!url || url.trim() === "") return true; // Empty URLs are considered valid
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Create a submission object, filtering out empty imageUrl
      const submission = {
        question: formData.question,
        answer: formData.answer,
        title: formData.title || undefined,
        tags: formData.tags,
        deckId: formData.deckId || undefined,
      };
      
      // Only include imageUrl if it's not empty
      if (formData.imageUrl && formData.imageUrl.trim() !== "") {
        Object.assign(submission, { imageUrl: formData.imageUrl });
      }
      
      createFlashcard.mutate(submission);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Enhanced header with pattern background */}
      <div className="relative bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ 
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "30px 30px"
          }} />
        </div>
        <div className="container py-10 relative z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="mr-4 transition-transform duration-200 hover:scale-105"
            >
              <Link href="/flashcards">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-foreground">
                Create New Flashcard
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Add a new flashcard to your collection to enhance your learning experience
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container py-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-4 p-1 rounded-lg bg-background/80 backdrop-blur-sm border">
                <TabsTrigger 
                  value="edit" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md flex items-center gap-2 transition-all"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Content
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md flex items-center gap-2 transition-all"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            
              <TabsContent value="edit">
                <Card className="border shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/20">
                  <form onSubmit={handleSubmit}>
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="flex items-center">
                        <LayoutTemplate className="h-5 w-5 mr-2 text-primary" />
                        Flashcard Details
                      </CardTitle>
                      <CardDescription>
                        Fill in the details below to create a new flashcard. Questions and answers are required.
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-8 pt-6">
                      {/* Deck Selection */}
                      <div className="space-y-2 relative">
                        <label htmlFor="deckId" className="text-sm font-medium flex items-center group">
                          Deck <span className="text-muted-foreground ml-1">(Optional)</span>
                          <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute left-full ml-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            Select a deck to add this flashcard to or leave blank to add without a deck.
                          </span>
                        </label>
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              id="deckId"
                              name="deckId"
                              value={formData.deckId}
                              onChange={handleChange}
                              className="w-full h-10 pl-10 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            >
                              <option value="">-- Select a Deck (Optional) --</option>
                              {loadingDecks ? (
                                <option disabled>Loading decks...</option>
                              ) : decks && decks.length > 0 ? (
                                decks.map((deck) => (
                                  <option key={deck.id} value={deck.id}>
                                    {deck.name} ({deck.cardCount} cards)
                                  </option>
                                ))
                              ) : (
                                <option disabled>No decks available</option>
                              )}
                            </select>
                            <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="w-full flex items-center justify-center text-primary"
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                Create New Deck
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Deck</DialogTitle>
                                <DialogDescription>
                                  Create a new flashcard deck to organize your cards
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                  <label htmlFor="new-deck-name" className="text-sm font-medium">
                                    Deck Name <span className="text-destructive">*</span>
                                  </label>
                                  <Input
                                    id="new-deck-name"
                                    placeholder="Enter a name for your deck"
                                    value={newDeckName}
                                    onChange={(e) => setNewDeckName(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label htmlFor="new-deck-description" className="text-sm font-medium">
                                    Description <span className="text-muted-foreground">(Optional)</span>
                                  </label>
                                  <Textarea
                                    id="new-deck-description"
                                    placeholder="Enter a description for your deck"
                                    value={newDeckDescription}
                                    onChange={(e) => setNewDeckDescription(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline" type="button">
                                    Cancel
                                  </Button>
                                </DialogClose>
                                <Button 
                                  type="button"
                                  onClick={() => {
                                    if (!newDeckName.trim()) {
                                      toast({
                                        title: "Error",
                                        description: "Deck name is required",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    createDeck.mutate({
                                      name: newDeckName,
                                      description: newDeckDescription,
                                    });
                                  }}
                                  disabled={createDeck.isLoading}
                                >
                                  {createDeck.isLoading ? "Creating..." : "Create Deck"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Title (optional) */}
                      <div className="space-y-2 relative">
                        <label htmlFor="title" className="text-sm font-medium flex items-center group">
                          Title <span className="text-muted-foreground ml-1">(Optional)</span>
                          <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute left-full ml-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            A short title helps you quickly identify this card.
                          </span>
                        </label>
                        <div className="relative">
                          <Input
                            id="title"
                            name="title"
                            placeholder="Enter a descriptive title"
                            value={formData.title}
                            onChange={handleChange}
                            className="pl-10 focus-visible:ring-primary/20 focus-visible:ring-2 transition-all"
                          />
                          <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      {/* Question */}
                      <div className="space-y-2">
                        <label htmlFor="question" className="text-sm font-medium">
                          Question <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Textarea
                            id="question"
                            name="question"
                            placeholder="Enter the question"
                            rows={3}
                            value={formData.question}
                            onChange={handleChange}
                            className={`pl-10 focus-visible:ring-primary/20 focus-visible:ring-2 transition-all ${
                              errors.question ? "border-destructive focus-visible:ring-destructive/20" : ""
                            }`}
                          />
                          <HelpCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        {errors.question && (
                          <p className="text-sm text-destructive flex items-center">
                            <X className="h-3.5 w-3.5 mr-1" />
                            {errors.question}
                          </p>
                        )}
                      </div>
                      
                      {/* Answer */}
                      <div className="space-y-2">
                        <label htmlFor="answer" className="text-sm font-medium">
                          Answer <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Textarea
                            id="answer"
                            name="answer"
                            placeholder="Enter the answer"
                            rows={5}
                            value={formData.answer}
                            onChange={handleChange}
                            className={`pl-10 focus-visible:ring-primary/20 focus-visible:ring-2 transition-all ${
                              errors.answer ? "border-destructive focus-visible:ring-destructive/20" : ""
                            }`}
                          />
                          <Pencil className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        {errors.answer && (
                          <p className="text-sm text-destructive flex items-center">
                            <X className="h-3.5 w-3.5 mr-1" />
                            {errors.answer}
                          </p>
                        )}
                      </div>
                      
                      {/* Image URL */}
                      <div className="space-y-2">
                        <label htmlFor="imageUrl" className="text-sm font-medium flex items-center group">
                          Image URL <span className="text-muted-foreground ml-1">(Optional)</span>
                          <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            Add an image to help illustrate your flashcard.
                          </span>
                        </label>
                        <div className="relative">
                          <Input
                            id="imageUrl"
                            name="imageUrl"
                            placeholder="https://example.com/image.jpg"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            className={`pl-10 focus-visible:ring-primary/20 focus-visible:ring-2 transition-all ${
                              errors.imageUrl || !isImageValid ? "border-destructive focus-visible:ring-destructive/20" : ""
                            }`}
                          />
                          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        {errors.imageUrl && (
                          <p className="text-sm text-destructive flex items-center">
                            <X className="h-3.5 w-3.5 mr-1" />
                            {errors.imageUrl}
                          </p>
                        )}
                        {formData.imageUrl && !errors.imageUrl && !isImageValid && (
                          <p className="text-sm text-amber-500 flex items-center">
                            <HelpCircle className="h-3.5 w-3.5 mr-1" />
                            Image could not be loaded. Check the URL and try again.
                          </p>
                        )}
                      </div>
                      
                      {/* Tags */}
                      <div className="space-y-2">
                        <label htmlFor="tags" className="text-sm font-medium flex items-center group">
                          Tags <span className="text-muted-foreground ml-1">(Optional)</span>
                          <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span className="absolute w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            Tags help you organize and find your flashcards more easily.
                          </span>
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md mb-2">
                          <div className="flex flex-wrap gap-1.5 mb-2 min-h-8">
                            {formData.tags.length === 0 && (
                              <span className="text-xs text-muted-foreground italic">
                                No tags added yet
                              </span>
                            )}
                            {formData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/15 text-primary hover:bg-primary/20 transition-colors group"
                              >
                                <Tag className="h-3 w-3 mr-1 opacity-70 group-hover:opacity-100" />
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1.5 text-primary hover:text-primary-foreground p-0.5 rounded-full hover:bg-primary/80 transition-colors"
                                  aria-label={`Remove tag ${tag}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="relative flex">
                            <Input
                              id="tagInput"
                              ref={tagInputRef}
                              placeholder="Add tags and press Enter"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={handleTagInputKeyDown}
                              className="pl-10 focus-visible:ring-primary/20 focus-visible:ring-2 transition-all"
                            />
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs text-primary hover:text-primary-foreground hover:bg-primary/80"
                              onClick={() => addTag(tagInput)}
                              disabled={!tagInput.trim()}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between border-t p-6 bg-muted/30">
                      <Button 
                        variant="outline" 
                        type="button" 
                        asChild
                        className="transition-all duration-200 hover:bg-background"
                      >
                        <Link href="/flashcards">Cancel</Link>
                      </Button>
                      <Button
                        type="submit"
                        disabled={createFlashcard.isLoading}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-all shadow-sm hover:shadow"
                      >
                        {createFlashcard.isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Create Flashcard
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="flex flex-col space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg border shadow">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-primary" />
                      Flashcard Preview
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This is how your flashcard will look. Click the card to flip between question and answer.
                    </p>
                    
                    {/* Flashcard Preview */}
                    <div className="perspective-[1000px] mx-auto w-full max-w-md h-64 cursor-pointer">
                      <div 
                        className={`relative w-full h-full transition-all duration-500 transform-style-3d ${
                          flipCard ? "rotate-y-180" : ""
                        }`}
                        onClick={() => setFlipCard(!flipCard)}
                      >
                        {/* Question Side */}
                        <div className="absolute inset-0 backface-hidden rounded-xl p-6 bg-card border-2 border-primary/10 shadow-lg flex flex-col">
                          {formData.title && (
                            <div className="text-sm font-medium text-muted-foreground mb-2 pb-2 border-b">
                              {formData.title}
                            </div>
                          )}
                          
                          <div className="flex-1 flex flex-col justify-center items-center">
                            {formData.imageUrl && isImageValid && (
                              <div className="mb-4 max-h-24 flex justify-center">
                                <img 
                                  src={formData.imageUrl} 
                                  alt="Flashcard illustration" 
                                  className="max-h-full object-contain rounded-md"
                                />
                              </div>
                            )}
                            
                            <div className="text-center">
                              {formData.question ? (
                                <p className="text-lg">{formData.question}</p>
                              ) : (
                                <p className="text-muted-foreground italic">Your question will appear here</p>
                              )}
                            </div>
                          </div>
                          
                          {formData.tags.length > 0 && (
                            <div className="mt-4 pt-2 border-t flex flex-wrap gap-1">
                              {formData.tags.map(tag => (
                                <span 
                                  key={tag} 
                                  className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            Click to flip
                          </div>
                        </div>
                        
                        {/* Answer Side */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl p-6 bg-primary/5 border-2 border-primary/20 shadow-lg flex flex-col">
                          {formData.title && (
                            <div className="text-sm font-medium text-muted-foreground mb-2 pb-2 border-b">
                              {formData.title}
                            </div>
                          )}
                          
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="text-center">
                              {formData.answer ? (
                                <p className="text-lg">{formData.answer}</p>
                              ) : (
                                <p className="text-muted-foreground italic">Your answer will appear here</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                            Click to flip
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Tips and Help Section */}
          <div className="lg:col-span-1">
            <Card className="border shadow sticky top-6">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-lg flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                  Tips for Great Flashcards
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4 text-sm">
                  <li className="flex gap-2">
                    <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Keep questions specific</p>
                      <p className="text-muted-foreground text-xs">Focus on one concept per flashcard for better retention.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Include visual aids</p>
                      <p className="text-muted-foreground text-xs">Images can improve memory and understanding of complex topics.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium text-xs">3</span>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Be concise with answers</p>
                      <p className="text-muted-foreground text-xs">Concise answers are easier to recall during study sessions.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium text-xs">4</span>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Use tags effectively</p>
                      <p className="text-muted-foreground text-xs">Organize your flashcards with relevant tags for easy filtering.</p>
                    </div>
                  </li>
                  
                  <li className="flex gap-2">
                    <div className="bg-primary/10 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-medium text-xs">5</span>
                    </div>
                    <div>
                      <p className="font-medium mb-0.5">Organize into decks</p>
                      <p className="text-muted-foreground text-xs">Group related flashcards into decks to study them together.</p>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Example Formats:</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Definition:</span> "What is CPR?" → "Cardiopulmonary Resuscitation, an emergency procedure..."</p>
                    <p><span className="font-medium text-foreground">Procedure:</span> "List steps for checking vital signs" → "1. Check breathing, 2. Check pulse..."</p>
                    <p><span className="font-medium text-foreground">Identification:</span> "How do you identify a stroke?" → "Use the FAST method: Face, Arms, Speech, Time"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}