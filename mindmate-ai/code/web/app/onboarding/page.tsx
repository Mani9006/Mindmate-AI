"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"

const useCases = [
  {
    id: "personal",
    label: "Personal Use",
    description: "For everyday tasks and personal projects",
  },
  {
    id: "work",
    label: "Work",
    description: "For professional and business use",
  },
  {
    id: "education",
    label: "Education",
    description: "For learning and research",
  },
  {
    id: "development",
    label: "Development",
    description: "For coding and technical projects",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUseCase, setSelectedUseCase] = useState("")

  const handleSubmit = async () => {
    if (!selectedUseCase) {
      toast({
        title: "Please select an option",
        description: "Let us know how you plan to use MindMate AI.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // TODO: Save onboarding preferences
      // await fetch("/api/user/onboarding", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ useCase: selectedUseCase }),
      // })

      toast({
        title: "Welcome to MindMate AI!",
        description: "Your account has been set up successfully.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Welcome to MindMate AI!
          </CardTitle>
          <CardDescription className="text-center">
            Help us personalize your experience by telling us a bit about
            yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>How do you plan to use MindMate AI?</Label>
            <RadioGroup
              value={selectedUseCase}
              onValueChange={setSelectedUseCase}
              className="grid gap-4"
            >
              {useCases.map((useCase) => (
                <div key={useCase.id}>
                  <RadioGroupItem
                    value={useCase.id}
                    id={useCase.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={useCase.id}
                    className="flex flex-col items-start rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="font-semibold">{useCase.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {useCase.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Setting up..." : "Get Started"}
          </Button>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground text-center hover:text-primary"
          >
            Skip for now
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
