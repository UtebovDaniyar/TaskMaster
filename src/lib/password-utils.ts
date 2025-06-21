export interface PasswordStrengthResult {
  score: number;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
  feedback: string[];
}

export const checkPasswordStrength = (password: string): PasswordStrengthResult => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  let score = 0;
  const feedback: string[] = [];

  // Подсчитываем базовый счет
  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  // Дополнительные баллы за длину
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Генерируем обратную связь
  if (!checks.length) feedback.push("Add minimum 8 characters");
  if (!checks.lowercase) feedback.push("Add lowercase letters");
  if (!checks.uppercase) feedback.push("Add uppercase letters");
  if (!checks.number) feedback.push("Add numbers");
  if (!checks.special) feedback.push("Add special characters");

  return { score, checks, feedback };
};

export const getPasswordStrengthLabel = (score: number): string => {
  if (score <= 2) return "Weak";
  if (score <= 4) return "Fair";
  if (score <= 6) return "Good";
  return "Strong";
};

export const getPasswordStrengthColor = (score: number): string => {
  if (score <= 2) return "red";
  if (score <= 4) return "yellow";
  if (score <= 6) return "blue";
  return "green";
}; 