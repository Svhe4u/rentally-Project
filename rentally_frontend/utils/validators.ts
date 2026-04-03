/**
 * Form Validators
 * Reusable validation functions for forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class Validator {
  static email(email: string): ValidationError | null {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(regex)) {
      return { field: 'email', message: 'Invalid email format' };
    }
    return null;
  }

  static password(password: string): ValidationError | null {
    if (password.length < 8) {
      return { field: 'password', message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { field: 'password', message: 'Password must contain uppercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { field: 'password', message: 'Password must contain number' };
    }
    return null;
  }

  static username(username: string): ValidationError | null {
    if (username.length < 3) {
      return { field: 'username', message: 'Username must be at least 3 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { field: 'username', message: 'Username can only contain letters, numbers, and underscore' };
    }
    return null;
  }

  static required(value: any, field: string): ValidationError | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { field, message: `${field} is required` };
    }
    return null;
  }

  static phoneNumber(phone: string): ValidationError | null {
    const regex = /^[\d\s\-\+\(\)]+$/;
    if (!phone.match(regex)) {
      return { field: 'phone', message: 'Invalid phone number' };
    }
    return null;
  }

  static url(url: string): ValidationError | null {
    try {
      new URL(url);
      return null;
    } catch {
      return { field: 'url', message: 'Invalid URL' };
    }
  }

  static priceRange(min: number, max: number): ValidationError | null {
    if (min >= max) {
      return { field: 'price', message: 'Minimum price must be less than maximum' };
    }
    return null;
  }

  static dateRange(startDate: Date, endDate: Date): ValidationError | null {
    if (startDate >= endDate) {
      return { field: 'dates', message: 'Start date must be before end date' };
    }
    return null;
  }
}

export function validateLoginForm(username: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  const usernameError = Validator.required(username, 'username');
  const passwordError = Validator.required(password, 'password');

  if (usernameError) errors.push(usernameError);
  if (passwordError) errors.push(passwordError);

  return errors;
}

export function validateRegistrationForm(data: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const usernameError = Validator.username(data.username);
  const emailError = Validator.email(data.email);
  const passwordError = Validator.password(data.password);

  if (usernameError) errors.push(usernameError);
  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);

  if (data.password !== data.passwordConfirm) {
    errors.push({ field: 'passwordConfirm', message: 'Passwords do not match' });
  }

  return errors;
}

export function validateListingForm(data: {
  title: string;
  description: string;
  price: number;
  address: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.title || data.title.length < 5) {
    errors.push({ field: 'title', message: 'Title must be at least 5 characters' });
  }

  if (!data.description || data.description.length < 20) {
    errors.push({ field: 'description', message: 'Description must be at least 20 characters' });
  }

  if (!data.price || data.price <= 0) {
    errors.push({ field: 'price', message: 'Price must be greater than 0' });
  }

  if (!data.address) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  return errors;
}
