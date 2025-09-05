"use client";
import axios, { AxiosError } from "axios";
import { ArrowRight, ChevronLeft, Loader2, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";

/**
 * Configuration constants for the OTP verification component
 */
const CONFIG = {
  OTP_LENGTH: 6,
  TIMER_DURATION: 60,
  COOKIE_EXPIRY_DAYS: 15,
  API_BASE_URL: "http://localhost:5000/api/v1",
} as const;

/**
 * API endpoints used by the component
 */
const API_ENDPOINTS = {
  VERIFY_OTP: `${CONFIG.API_BASE_URL}/verify-otp`,
  RESEND_OTP: `${CONFIG.API_BASE_URL}/login`,
} as const;

/**
 * Interface for API response structure
 */
interface ApiResponse {
  message: string;
  token?: string;
}

/**
 * Interface for error response structure
 */
interface ApiError {
  message: string;
}

/**
 * Props interface for the VerifyPage component
 */
interface VerifyPageProps {
  /** Optional className for additional styling */
  className?: string;
}

/**
 * VerifyPage Component - Handles email verification through OTP with enhanced documentation and responsiveness.
 *
 * @component
 * @description A comprehensive email verification component that provides:
 * - Responsive 6-digit OTP input with auto-focus functionality
 * - Smart paste support for OTP codes
 * - Countdown timer with resend functionality
 * - Loading states for all async operations
 * - Comprehensive error handling with user-friendly messages
 * - Mobile-first responsive design
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Cookie-based token management
 *
 * @example
 * ```tsx
 * // Basic usage
 * <VerifyPage />
 * 
 * // With custom styling
 * <VerifyPage className="custom-verify-page" />
 * ```
 *
 * @param {VerifyPageProps} props - Component props
 * @returns {JSX.Element} A responsive form with OTP verification interface
 *
 * @features
 * - **Auto-focus**: Automatically moves focus to the next input field
 * - **Paste Support**: Handles pasting of 6-digit codes
 * - **Keyboard Navigation**: Supports backspace navigation
 * - **Timer Management**: 60-second countdown for resend functionality
 * - **Error Handling**: Comprehensive error messages for different failure scenarios
 * - **Loading States**: Visual feedback during API calls
 * - **Responsive Design**: Works seamlessly across all device sizes
 * - **Token Management**: Automatic cookie storage upon successful verification
 *
 * @state
 * @property {boolean} loading - Controls loading state during OTP verification
 * @property {string[]} otp - Array storing individual OTP digits (length: 6)
 * @property {string} error - Current error message to display to user
 * @property {boolean} resendLoading - Loading state for OTP resend operation
 * @property {number} timer - Countdown timer for resend button (starts at 60)
 *
 * @hooks
 * @property {React.RefObject<(HTMLInputElement | null)[]>} inputRefs - References to OTP input fields for focus management
 * @property {NextRouter} router - Next.js router for navigation
 * @property {ReadonlyURLSearchParams} searchParams - URL search parameters (expects 'email' parameter)
 *
 * @apiCalls
 * - POST /verify-otp - Verifies the entered OTP code
 * - POST /login - Resends OTP to the user's email
 *
 * @cookies
 * - Sets 'token' cookie upon successful verification with 15-day expiry
 *
 * @accessibility
 * - Proper ARIA labels for screen readers
 * - Keyboard navigation support
 * - Focus management for better UX
 * - High contrast colors for visibility
 *
 * @responsive
 * - Mobile-first design approach
 * - Adaptive spacing and sizing
 * - Touch-friendly input fields
 * - Optimized for screens from 320px to 1920px+
 */
const VerifyOtp: React.FC<VerifyPageProps> = ({ className = "" }) => {
  // ========================================
  // State Management
  // ========================================
  
  /** Loading state for OTP verification process */
  const [loading, setLoading] = useState<boolean>(false);

  /** Array to store individual OTP digits */
  const [otp, setOtp] = useState<string[]>(
    new Array(CONFIG.OTP_LENGTH).fill("")
  );

  /** Error message state for user feedback */
  const [error, setError] = useState<string>("");

  /** Loading state for OTP resend operation */
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  /** Countdown timer for resend button availability */
  const [timer, setTimer] = useState<number>(CONFIG.TIMER_DURATION);

  // ========================================
  // Refs and Hooks
  // ========================================
  
  /** References to OTP input fields for focus management */
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /** Next.js router instance for navigation */
  const router = useRouter();

  /** URL search parameters to extract email */
  const searchParams = useSearchParams();

  /** Email address from URL parameters */
  const email: string = searchParams.get("email") || "";

  // ========================================
  // Effects
  // ========================================
  
  /**
   * Timer effect for countdown functionality
   * Decrements timer every second when timer > 0
   */
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer]);

  /**
   * Focus the first input field when component mounts
   */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ========================================
  // Event Handlers
  // ========================================
  
  /**
   * Handles input change for OTP fields
   * @param {number} index - Index of the input field (0-5)
   * @param {string} value - New value entered
   */
  const handleInputChange = (index: number, value: string): void => {
    // Allow only single digit
    if (value.length > 1) return;
    
    // Allow only numeric values
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    // Auto-focus next field if value entered and not last field
    if (value && index < CONFIG.OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handles keyboard navigation for OTP inputs
   * @param {number} index - Current input field index
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Keyboard event
   */
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    // Move to previous field on backspace if current field is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow key navigation
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowRight" && index < CONFIG.OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handles paste operation for OTP input
   * @param {React.ClipboardEvent<HTMLInputElement>} e - Paste event
   */
  const handlePasteOTP = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Validate pasted data
    if (pastedData.length === CONFIG.OTP_LENGTH && /^\d{6}$/.test(pastedData)) {
      const pastedOtp = pastedData.split("");
      setOtp(pastedOtp);
      
      // Focus last input field
      inputRefs.current[CONFIG.OTP_LENGTH - 1]?.focus();
      
      // Clear any existing errors
      if (error) {
        setError("");
      }
    } else {
      setError("Please paste a valid 6-digit code");
    }
  };

  /**
   * Handles form submission for OTP verification
   * @param {React.FormEvent<HTMLFormElement>} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const otpString = otp.join("");
    
    // Validation
    if (otpString.length < CONFIG.OTP_LENGTH) {
      setError("Please enter all 6 digits");
      return;
    }
    
    if (!email) {
      setError("Email address is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data }: { data: ApiResponse } = await axios.post(
        API_ENDPOINTS.VERIFY_OTP,
        {
          email,
          otp: otpString,
        }
      );

      // Success feedback
      alert(data.message);
      
      // Store token in cookie if provided
      if (data.token) {
        Cookies.set("token", data.token, {
          expires: CONFIG.COOKIE_EXPIRY_DAYS,
          secure: false,
          path: "/",
         
        });
      }

      // Reset form
      setOtp(new Array(CONFIG.OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      
      // Navigate to dashboard or intended page
      // router.push("/dashboard");
      
    } catch (error: unknown) {
      console.error("OTP verification failed:", error);
      
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ApiError;
        setError(`Verification failed: ${errorData.message}`);
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles OTP resend functionality
   */
  const handleResendOTP = async (): Promise<void> => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      const { data }: { data: ApiResponse } = await axios.post(
        API_ENDPOINTS.RESEND_OTP,
        { email }
      );

      // Success feedback
      alert(data.message);
      
      // Reset timer and clear OTP
      setTimer(CONFIG.TIMER_DURATION);
      setOtp(new Array(CONFIG.OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      
    } catch (error: unknown) {
      console.error("OTP resend failed:", error);
      
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ApiError;
        setError(`Resend failed: ${errorData.message}`);
      } else {
        setError("Resend failed. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  /**
   * Formats timer display with leading zeros
   * @param {number} seconds - Seconds to format
   * @returns {string} Formatted time string (MM:SS)
   */
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={`min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sm:p-8 shadow-2xl">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8 relative">
            {/* Back Button */}
            <button
              onClick={() => router.push("/login")}
              className="absolute top-0 left-0 p-2 text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label="Go back to login"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Icon */}
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
              <Lock size={32} className="text-white sm:w-10 sm:h-10" />
            </div>

            {/* Title and Description */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Verify Your Email
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed">
              We have sent a 6-digit verification code to {" "} <br />
              <span className="font-semibold text-blue-400 break-all">
                {email || "your email"}
              </span>
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                Enter Your 6-digit code
              </label>
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el: HTMLInputElement | null) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePasteOTP : undefined}
                    className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-center text-lg sm:text-xl lg:text-2xl font-bold bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    aria-label={`Digit ${index + 1} of 6`}
                  />
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <p className="text-red-300 text-sm text-center" role="alert">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={loading || otp.join("").length < CONFIG.OTP_LENGTH}
              aria-label="Verify OTP code"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Verify</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Didn't receive the code?{" "}
              {timer > 0 ? (
                <span className="text-gray-400">
                  Resend in {formatTimer(timer)}
                </span>
              ) : (
                <button
                  onClick={handleResendOTP}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  disabled={resendLoading}
                  aria-label="Resend OTP code"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;