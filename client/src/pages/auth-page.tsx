import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User } from "lucide-react";

// Extend the insert schema with validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
});

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Initialize login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Initialize register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
    },
  });

  // Handle login form submission
  function onLoginSubmit(data: z.infer<typeof loginSchema>) {
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  }

  // Handle register form submission
  function onRegisterSubmit(data: z.infer<typeof registerSchema>) {
    registerMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  }

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Left side - Auth forms */}
      <div className="flex flex-col justify-center px-4 py-12 w-full md:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-slate-900 dark:text-white">MemoryLane</h1>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {activeTab === "login" ? "Welcome back" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login" 
                  ? "Sign in to access your memories and friends."
                  : "Join to start saving and sharing your special moments."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as "login" | "register")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your display name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center text-muted-foreground">
                {activeTab === "login" ? (
                  <span>Don't have an account? <Button onClick={() => setActiveTab("register")} variant="link" className="p-0">Register</Button></span>
                ) : (
                  <span>Already have an account? <Button onClick={() => setActiveTab("login")} variant="link" className="p-0">Sign in</Button></span>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Right side - Hero/Marketing section */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-12 items-center justify-center">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">Capture your moments, create lasting memories</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/10 p-2 rounded-md">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Calendar-Based Timeline</h3>
                <p className="mt-1 text-white/80">Organize and explore your memories through an intuitive calendar interface.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/10 p-2 rounded-md">
                <User className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Connect with Friends</h3>
                <p className="mt-1 text-white/80">Share your special moments with friends and family or keep them private.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/10 p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Record Your Stories</h3>
                <p className="mt-1 text-white/80">Add photos and detailed descriptions to preserve your most precious memories.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 bg-white/5 p-5 rounded-lg border border-white/10">
            <blockquote className="italic">
              "MemoryLane helps me capture and organize the special moments in my life that I never want to forget."
            </blockquote>
            <div className="mt-2 text-sm font-medium">– Sarah, MemoryLane User</div>
          </div>
        </div>
      </div>
    </div>
  );
}
