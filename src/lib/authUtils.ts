/**
 * Utility functions for user authentication, password hashing, and visual security meters.
 */

/**
 * Computes the SHA-256 hash of a string using the browser's crypto API.
 * Falls back to a neat pure-javascript SHA-256 implementation if the browser's crypto API is not available
 * (e.g. in some nested sandbox iframes).
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
  } catch (e) {
    console.warn('SubtleCrypto not available, falling back to client-side hash', e);
  }

  // Fallback pure JS SHA-256 implementation
  return sha256PureJS(password);
}

function sha256PureJS(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j; // Used as a loop index
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
      h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const primeCounter = [];
  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) { 
      if (n % factor === 0) return false; 
    }
    return true;
  };

  let candidate = 2;
  while (primeCounter[lengthProperty] < 64) {
    if (isPrime(candidate)) {
      primeCounter.push(candidate);
    }
    candidate++;
  }

  const K = primeCounter.map(p => Math.floor(mathPow(p, 1/3) * maxWord));
  const H = [h0, h1, h2, h3, h4, h5, h6, h7];

  let asciiChars = ascii.split('').map(c => c.charCodeAt(0));
  asciiChars.push(0x80); // Append a '1' bit
  while (asciiChars[lengthProperty] % 64 !== 56) {
    asciiChars.push(0);
  }

  // Append length of message in bits
  const bitsLength = asciiLength * 8;
  asciiChars.push(0, 0, 0, 0, 0, 0, 0, bitsLength);

  for (i = 0; i < asciiChars[lengthProperty]; i += 64) {
    const w: number[] = [];
    for (j = 0; j < 16; j++) {
      const idx = i + j * 4;
      w[j] = (asciiChars[idx] << 24) | (asciiChars[idx + 1] << 16) | (asciiChars[idx + 2] << 8) | asciiChars[idx + 3];
    }
    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    const word = H[i] >>> 0;
    result += word.toString(16).padStart(2, '0');
  }

  return result;
}

/**
 * Checks password strength and returns a score from 0 to 4
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0 to 4
  feedback: string[];
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, feedback: ['Requires a password'], label: 'Weak', color: 'bg-rose-500' };
  }

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Must be at least 8 characters');
  }

  // Letters checks
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include an uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    // Normal bonus
  }

  // Numbers check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include a numeric character');
  }

  // Special characters check
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include a special character (e.g., !@#$)');
  }

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let color = 'bg-rose-500';

  if (score === 2) {
    label = 'Fair';
    color = 'bg-amber-500';
  } else if (score === 3) {
    label = 'Good';
    color = 'bg-emerald-500/80';
  } else if (score >= 4) {
    label = 'Strong';
    color = 'bg-emerald-500';
  }

  return { score, feedback, label, color };
}

/**
 * Predefined list of security recovery questions.
 */
export const SECURITY_QUESTIONS = [
  'What was your first childhood pet name?',
  'In which city/island were you born?',
  'What is your favorite custom kava grade or island?',
  'What was the name of your first school?',
  'Who is your childhood hero?',
];
