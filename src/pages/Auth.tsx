
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define form schemas
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.enum(["student", "lecturer", "admin"]),
  department: z.string().optional(),
});

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Clean up auth state to avoid lingering tokens
  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);
  
  // Sign In form setup
  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Sign Up form setup
  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      userType: 'student',
      department: '',
    },
  });

  // Handle sign in
  const handleSignIn = async (data: z.infer<typeof signInSchema>) => {
    try {
      setLoading(true);

      // Clean up existing auth state
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error("Error during global sign out:", err);
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "You have successfully signed in",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message || "Check your credentials and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (data: z.infer<typeof signUpSchema>) => {
    try {
      setLoading(true);
      
      // Clean up existing auth state
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error("Error during global sign out:", err);
      }

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            user_type: data.userType,
            department: data.department || null,
          },
        },
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("User creation failed");
      }

      // Then store the additional data in the appropriate table
      const tableName = `${data.userType}_users`;
      
      // Fix the issue with table name by using a type-safe approach
      if (
        tableName === 'admin_users' || 
        tableName === 'lecturer_users' || 
        tableName === 'student_users'
      ) {
        const { error: profileError } = await supabase
          .from(tableName)
          .insert({
            id: authData.user.id,
            name: data.name,
            email: data.email,
            ...(data.userType === 'lecturer' ? { department: data.department } : {}),
          });

        if (profileError) {
          // If profile creation fails, attempt to clean up the auth user
          console.error("Error creating profile, cleaning up auth user");
          throw profileError;
        }
      }
      
      toast({
        title: "Account created",
        description: "You have successfully signed up. You can now sign in.",
      });
      
      // Redirect back to sign in tab
      signInForm.reset({
        email: data.email,
        password: data.password,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create test accounts
  const createTestAccounts = async () => {
    try {
      setLoading(true);
      
      // Test accounts data
      const testUsers = [
        {
          email: 'admin@example.com',
          password: 'password123',
          name: 'Admin Test',
          userType: 'admin',
        },
        {
          email: 'lecturer@example.com',
          password: 'password123',
          name: 'Lecturer Test',
          userType: 'lecturer',
          department: 'Computer Science'
        },
        {
          email: 'student@example.com',
          password: 'password123',
          name: 'Student Test',
          userType: 'student',
        }
      ];
      
      let createdUsers = 0;
      let errorsFound = false;
      
      // Create each test account
      for (const user of testUsers) {
        // Clean up any existing auth state before each operation
        cleanupAuthState();
        
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (err) {
          console.error("Error during global sign out:", err);
        }
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
              user_type: user.userType,
              ...(user.department ? { department: user.department } : {}),
            },
          },
        });
        
        if (authError) {
          console.error(`Error creating ${user.userType} test account:`, authError);
          errorsFound = true;
          continue;
        }
        
        if (!authData.user) {
          console.error(`Failed to create ${user.userType} test account`);
          continue;
        }
        
        // Insert into the appropriate table
        const tableName = `${user.userType}_users` as 'admin_users' | 'lecturer_users' | 'student_users';
        
        const { error: profileError } = await supabase
          .from(tableName)
          .insert({
            id: authData.user.id,
            name: user.name,
            email: user.email,
            ...(user.userType === 'lecturer' ? { department: user.department } : {}),
          });
        
        if (profileError) {
          console.error(`Error creating ${user.userType} profile:`, profileError);
          errorsFound = true;
          continue;
        }
        
        createdUsers++;
      }
      
      if (createdUsers > 0) {
        toast({
          title: "Test Accounts Created",
          description: `Created ${createdUsers} test accounts. You can now sign in with them.`,
        });
        
        // Pre-fill the form with admin credentials
        signInForm.reset({
          email: 'admin@example.com',
          password: 'password123',
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create test accounts. Check console for details.",
        });
      }
      
    } catch (error: any) {
      console.error("Error creating test accounts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create test accounts",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Learning Sphere</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  onClick={createTestAccounts}
                  disabled={loading}
                >
                  Create Test Accounts
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="userType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Type</FormLabel>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select user type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="lecturer">Lecturer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {signUpForm.watch("userType") === "lecturer" && (
                    <FormField
                      control={signUpForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
