'use client';

import React, { useState, useEffect } from 'react';
import { Phone, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function PhoneNumberInput({
  value,
  onChange,
  onValidationChange,
  disabled = false,
  placeholder = "Enter your phone number",
  className,
  error
}: PhoneNumberInputProps) {
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Format phone number as user types
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Limit to 11 digits (1 + 10 for US numbers)
    const limitedDigits = digitsOnly.slice(0, 11);
    
    // Format based on length
    if (limitedDigits.length === 0) return '';
    
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
    } else if (limitedDigits.length <= 10) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else {
      // Handle 11 digits (with country code)
      return `+${limitedDigits.slice(0, 1)} (${limitedDigits.slice(1, 4)}) ${limitedDigits.slice(4, 7)}-${limitedDigits.slice(7)}`;
    }
  };

  // Validate phone number
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Valid if 10 digits (US) or 11 digits starting with 1 (US with country code)
    return (
      (digitsOnly.length === 10) ||
      (digitsOnly.length === 11 && digitsOnly.startsWith('1'))
    );
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneNumber(rawValue);
    onChange(formattedValue);
  };

  // Update validation when value changes
  useEffect(() => {
    const valid = validatePhoneNumber(value);
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [value, onValidationChange]);

  // Get validation message
  const getValidationMessage = (): string => {
    if (!value) return '';
    if (error) return error;
    
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    
    if (digitsOnly.length === 11 && !digitsOnly.startsWith('1')) {
      return 'For 11-digit numbers, must start with 1 (US country code)';
    }
    
    if (digitsOnly.length > 11) {
      return 'Phone number is too long';
    }
    
    return '';
  };

  const validationMessage = getValidationMessage();
  const hasError = !!validationMessage;
  const showSuccess = value && isValid && !hasError && !isFocused;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className={cn(
            "h-5 w-5 transition-colors",
            hasError 
              ? "text-red-500 dark:text-red-400" 
              : showSuccess 
              ? "text-green-500 dark:text-green-400" 
              : isFocused 
              ? "text-blue-500 dark:text-blue-400" 
              : "text-gray-400 dark:text-gray-500"
          )} />
        </div>
        
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
              "block w-full pl-10 pr-10 py-3 border rounded-lg text-sm transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              hasError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
                : showSuccess
                ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-green-50/20"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white",
              disabled && "bg-gray-50 text-gray-500 cursor-not-allowed",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
              "dark:focus:border-blue-400 dark:focus:ring-blue-400",
              showSuccess && "dark:bg-green-900/20"
            )}
          autoComplete="tel"
          inputMode="tel"
        />
        
        {/* Validation icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {hasError && (
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          )}
          {showSuccess && (
            <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
          )}
        </div>
      </div>
      
      {/* Validation message */}
      {validationMessage && (
        <p className={cn(
          "text-sm flex items-center space-x-1",
          hasError ? "text-red-600" : "text-gray-600"
        )}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validationMessage}</span>
        </p>
      )}
      
      {/* Helper text */}
      {!validationMessage && !value && (
        <p className="text-sm text-gray-500">
          Enter your phone number to receive the interview call
        </p>
      )}
      
      {/* Success message */}
      {showSuccess && (
        <p className="text-sm text-green-600 flex items-center space-x-1">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Valid phone number</span>
        </p>
      )}
    </div>
  );
}