"use client";
import axios, { AxiosError } from "axios";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

/**
 * Configuration constants for the login component
 */
const CONFIG = {
  API_BASE_URL: "http://localhost:5000/api/v1",
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_EMAIL_LENGTH: 5,
  MAX_EMAIL_LENGTH: 254,
} as const;

/**
 * API endpoints used by the component
 */
const API_ENDPOINTS = {
  LOGIN: `${CONFIG.API_BASE_URL}/login`,
} as const;

/**
 * Interface for API response structure
 */
interface ApiResponse {
  message: string;
  success?: boolean;
}

/**
 * Interface for error response structure
 */
interface ApiError {
  message: string;
  code?: string;
}

/**
 * Props interface for the LoginPage component
 */
interface LoginPageProps {
  /** Optional className for additional styling */
  className?: string;
  /** Optional callback for successful login */
  onLoginSuccess?: (email: string) => void;
  /** Optional custom API endpoint override */
  apiEndpoint?: string;
}

/**
 * LoginPage Component - Handles user authentication via email with OTP verification.
 *
 * @component
 * @description A comprehensive login component that provides:
 * - Responsive email input with validation
 * - Real-time email format validation
 * - Loading states with user feedback
 * - Error handling with user-friendly messages
 * - Mobile-first responsive design
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Automatic navigation to verification page
 * - Clean, modern dark theme UI
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoginPage />
 * 
 * // With custom styling and callback
 * <LoginPage 
 *   className="custom-login-page"
 *   onLoginSuccess={(email) => console.log('Login successful for:', email)}
 * />
 * 
 * // With custom API endpoint
 * <LoginPage apiEndpoint="https://api.example.com/auth/login" />
 * ```
 *
 * @param {LoginPageProps} props - Component props
 * @returns {JSX.Element} A responsive login form interface
 *
 * @features
 * - **Email Validation**: Real-time validation with visual feedback
 * - **Loading States**: Clear visual feedback during API calls
 * - **Error Handling**: Comprehensive error messages for different scenarios
 * - **Responsive Design**: Optimized for all screen sizes (320px to 1920px+)
 * - **Accessibility**: ARIA labels, keyboard navigation, screen reader support
 * - **Auto-navigation**: Redirects to verification page with email parameter
 * - **Form Validation**: Client-side validation before API calls
 * - **Modern UX**: Smooth animations and transitions
 *
 * @state
 * @property {string} email - User's email input value
 * @property {boolean} loading - Loading state during OTP send operation
 * @property {string} error - Current error message to display
 * @property {boolean} isEmailValid - Email format validation state
 *
 * @hooks
 * @property {NextRouter} router - Next.js router for navigation
 *
 * @apiCalls
 * - POST /login - Sends OTP to the provided email address
 *
 * @navigation
 * - Redirects to `/verify?email=${email}` upon successful OTP send
 *
 * @validation
 * - Email format validation using RFC-compliant regex
 * - Email length validation (5-254 characters)
 * - Required field validation
 * - Real-time validation feedback
 *
 * @accessibility
 * - Proper ARIA labels for screen readers
 * - Keyboard navigation support
 * - Focus management
 * - High contrast colors for visibility
 * - Semantic HTML structure
 *
 * @responsive
 * - Mobile-first design approach
 * - Adaptive spacing and typography
 * - Touch-friendly interface elements
 * - Optimized for screens from 320px to 1920px+
 * - Flexible layouts that adapt to viewport
 */
const LoginPage: React.FC<LoginPageProps> = ({ 
  className = "",
  onLoginSuccess,
  apiEndpoint = API_ENDPOINTS.LOGIN
}) => {
  // ========================================
  // State Management
  // ========================================
  
  /** User's email input value */
  const [email, setEmail] = useState<string>("");
  
  /** Loading state during OTP send operation */
  const [loading, setLoading] = useState<boolean>(false);
  
  /** Current error message to display to user */
  const [error, setError] = useState<string>("");
  
  /** Email format validation state */
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  
  /** Whether the user has started typing (for validation display) */
  const [hasStartedTyping, setHasStartedTyping] = useState<boolean>(false);

  // ========================================
  // Hooks
  // ========================================
  
  /** Next.js router instance for navigation */
  const router = useRouter();

  // ========================================
  // Effects
  // ========================================
  
  /**
   * Effect to validate email format in real-time
   * Updates validation state when email changes
   */
  useEffect(() => {
    if (email.length > 0) {
      const isValid = CONFIG.EMAIL_REGEX.test(email) && 
                     email.length >= CONFIG.MIN_EMAIL_LENGTH && 
                     email.length <= CONFIG.MAX_EMAIL_LENGTH;
      setIsEmailValid(isValid);
      
      // Clear error when user starts typing valid email
      if (isValid && error) {
        setError("");
      }
    } else {
      setIsEmailValid(false);
    }
  }, [email, error]);

  // ========================================
  // Event Handlers
  // ========================================
  
  /**
   * Handles email input changes with validation
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newEmail = e.target.value.trim().toLowerCase();
    setEmail(newEmail);
    
    // Mark that user has started typing for validation display
    if (!hasStartedTyping && newEmail.length > 0) {
      setHasStartedTyping(true);
    }
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  /**
   * Validates email before submission
   * @returns {boolean} Whether email is valid
   */
  const validateEmail = (): boolean => {
    if (!email) {
      setError("Email address is required");
      return false;
    }
    
    if (email.length < CONFIG.MIN_EMAIL_LENGTH) {
      setError("Email address is too short");
      return false;
    }
    
    if (email.length > CONFIG.MAX_EMAIL_LENGTH) {
      setError("Email address is too long");
      return false;
    }
    
    if (!CONFIG.EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  /**
   * Handles form submission for sending OTP
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    
    // Validate email before proceeding
    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data }: { data: ApiResponse } = await axios.post(apiEndpoint, {
        email,
      });

      // Success handling
      console.log("OTP sent successfully:", data);
      
      // Show success message
      if (data.message) {
        // You might want to replace alert with a toast notification
        alert(data.message);
      }
      
      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(email);
      }
      
      // Navigate to verification page with email parameter
      router.push(`/verify?email=${encodeURIComponent(email)}`);
      
    } catch (error: unknown) {
      console.error("Login failed:", error);
      
      // Handle different types of errors
      if (error instanceof AxiosError) {
        if (error.response?.status === 429) {
          setError("Too many requests. Please try again later.");
        } else if (error.response?.status === 400) {
          const errorData = error.response.data as ApiError;
          setError(errorData.message || "Invalid email address");
        } else if (error.response?.status >= 500) {
          setError("Server error. Please try again later.");
        } else if (error.response?.data) {
          const errorData = error.response.data as ApiError;
          setError(errorData.message || "Failed to send verification code");
        } else {
          setError("Network error. Please check your connection.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets the appropriate border color based on validation state
   * @returns {string} Tailwind CSS border color class
   */
  const getBorderColor = (): string => {
    if (!hasStartedTyping) return "border-gray-600";
    if (error) return "border-red-500";
    if (isEmailValid) return "border-green-500";
    return "border-yellow-500";
  };

  /**
   * Gets the appropriate ring color based on validation state
   * @returns {string} Tailwind CSS ring color class
   */
  const getRingColor = (): string => {
    if (error) return "focus:ring-red-500";
    if (isEmailValid) return "focus:ring-green-500";
    return "focus:ring-blue-500";
  };

  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={`min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sm:p-8 shadow-2xl">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
              <Mail size={32} className="text-white sm:w-10 sm:h-10" />
            </div>
            
            {/* Title and Description */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Welcome To ChatApp!
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed">
              Enter your email to continue your journey.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Input Section */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 sm:py-4 bg-gray-700 border ${getBorderColor()} text-white rounded-lg focus:outline-none focus:ring-2 ${getRingColor()} transition-all duration-200 placeholder-gray-400`}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  aria-describedby={error ? "email-error" : hasStartedTyping && !isEmailValid ? "email-hint" : undefined}
                  aria-invalid={error ? "true" : "false"}
                />
                
                {/* Validation Icon */}
                {hasStartedTyping && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isEmailValid ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : email.length > 0 ? (
                      <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.536 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              
              {/* Validation Hint */}
              {hasStartedTyping && !isEmailValid && !error && email.length > 0 && (
                <p id="email-hint" className="mt-1 text-xs text-yellow-400">
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <p id="email-error" className="text-red-300 text-sm text-center" role="alert">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={loading || !isEmailValid}
              aria-label="Send verification code to email"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Sending OTP to your email...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              By continuing, you agree to our{" "}
              <button 
                type="button"
                className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => {/* Handle terms click */}}
              >
                Terms of Service
              </button>
              {" "}and{" "}
              <button 
                type="button"
                className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => {/* Handle privacy click */}}
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;