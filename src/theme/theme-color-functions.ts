import chroma from 'chroma-js';

/**
 * Default text colors from variables-quadrone.less
 * These correspond to the CSS variables:
 * - --t5e-color-palette-grey-100 (white)
 * - --t5e-color-palette-grey-0 (black)
 */
const TEXT_COLOR_LIGHT = '#ffffff'; // --t5e-color-palette-grey-100
const TEXT_COLOR_DARK = '#000000'; // --t5e-color-palette-grey-0

/**
 * Theme class names to apply for light/dark text
 */
const THEME_CLASS_LIGHT = 'theme-light';
const THEME_CLASS_DARK = 'theme-dark';

/**
 * APCA (Accessible Perceptual Contrast Algorithm) minimum contrast values.
 * APCA returns Lc (Lightness Contrast) values from approximately -108 to +106.
 *
 * Polarity:
 * - Positive Lc: dark text on light background
 * - Negative Lc: light text on dark background
 *
 * Recommended minimums (absolute values):
 * - 90+ : Preferred for body text
 * - 75  : Minimum for body text
 * - 60  : Large text / non-text UI elements
 * - 45  : Large headlines, pictograms
 * - 30  : Minimum for any text (placeholder, disabled)
 *
 * @see https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell
 */
const APCA_BODY_TEXT = 75;
const APCA_CONTENT_TEXT = 60;
const APCA_HEADLINE = 45;

export type ContrastLevel = 'body' | 'large' | 'headline';

export type ContrastResult = {
  /** The original color value provided */
  originalColor: string;
  /** The final color value (adjusted if needed) */
  color: string;
  /** The theme class to apply ('theme-light' or 'theme-dark') */
  themeClass: typeof THEME_CLASS_LIGHT | typeof THEME_CLASS_DARK;
  /** The text color that will be used (white or black) */
  textColor: string;
  /** The APCA Lc contrast value achieved (absolute value) */
  contrastLc: number;
  /** Whether the color was adjusted to meet contrast requirements */
  wasAdjusted: boolean;
  /** Whether the contrast check passed */
  passesContrast: boolean;
};

export type ContrastOptions = {
  /** Text size level - 'body' (default), 'large', or 'headline' */
  level?: ContrastLevel;
  /** Whether to auto-adjust the color if it fails contrast (default: true) */
  autoAdjust?: boolean;
};

/**
 * Gets the minimum APCA Lc value required for the given text size level
 */
function getMinContrastLc(level: ContrastLevel): number {
  switch (level) {
    case 'headline':
      return APCA_HEADLINE;
    case 'large':
      return APCA_CONTENT_TEXT;
    case 'body':
    default:
      return APCA_BODY_TEXT;
  }
}

/**
 * Calculates the APCA contrast between text and background colors.
 * Returns the absolute Lc value.
 *
 * @param textColor - The text/foreground color
 * @param backgroundColor - The background color
 * @returns Absolute APCA Lc value (0-106 range)
 */
function getContrastAPCA(textColor: string, backgroundColor: string): number {
  try {
    // chroma.contrastAPCA(text, background) returns signed Lc
    const lc = chroma.contrastAPCA(textColor, backgroundColor);
    return Math.abs(lc);
  } catch {
    return 0;
  }
}

/**
 * Determines which text color (light or dark) provides better APCA contrast
 * against the given background color.
 */
function getBestTextColor(backgroundColor: string): {
  textColor: string;
  themeClass: typeof THEME_CLASS_LIGHT | typeof THEME_CLASS_DARK;
  contrastLc: number;
} {
  const contrastWithLight = getContrastAPCA(TEXT_COLOR_LIGHT, backgroundColor);
  const contrastWithDark = getContrastAPCA(TEXT_COLOR_DARK, backgroundColor);

  if (contrastWithLight >= contrastWithDark) {
    return {
      textColor: TEXT_COLOR_LIGHT,
      themeClass: THEME_CLASS_DARK, // Dark theme = light text
      contrastLc: contrastWithLight,
    };
  }

  return {
    textColor: TEXT_COLOR_DARK,
    themeClass: THEME_CLASS_LIGHT, // Light theme = dark text
    contrastLc: contrastWithDark,
  };
}

/**
 * Adjusts a color using LCH to meet the minimum APCA contrast requirement
 * against the specified text color.
 *
 * Strategy:
 * - For light text (dark theme): darken the background
 * - For dark text (light theme): lighten the background
 *
 * Uses binary search to find the nearest passing color while
 * preserving hue and adjusting lightness.
 */
function adjustColorForContrast(
  color: string,
  textColor: string,
  minContrastLc: number
): string {
  try {
    const chromaColor = chroma(color);
    const isLightText = textColor === TEXT_COLOR_LIGHT;

    // Get LCH components
    let [l, c, h] = chromaColor.lch();

    // Binary search for the correct lightness
    let minL = isLightText ? 0 : l;
    let maxL = isLightText ? l : 100;
    let adjustedColor = chromaColor;
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations) {
      const midL = (minL + maxL) / 2;

      // Create color with adjusted lightness, preserving chroma and hue
      // Handle NaN hue (for achromatic colors)
      const testColor = Number.isNaN(h)
        ? chroma.lch(midL, c, 0)
        : chroma.lch(midL, c, h);

      const contrastLc = getContrastAPCA(textColor, testColor.hex());

      if (Math.abs(contrastLc - minContrastLc) < 1) {
        // Close enough (within 1 Lc)
        adjustedColor = testColor;
        break;
      }

      if (isLightText) {
        // For light text, we need to darken (decrease L)
        if (contrastLc < minContrastLc) {
          maxL = midL; // Need darker
        } else {
          minL = midL; // Can go lighter (closer to original)
        }
      } else {
        // For dark text, we need to lighten (increase L)
        if (contrastLc < minContrastLc) {
          minL = midL; // Need lighter
        } else {
          maxL = midL; // Can go darker (closer to original)
        }
      }

      adjustedColor = testColor;
      iterations++;
    }

    // If still not passing after adjustment, try reducing chroma as well
    const finalContrast = getContrastAPCA(textColor, adjustedColor.hex());
    if (finalContrast < minContrastLc) {
      // Try with reduced chroma
      const reducedChroma = Math.max(0, c * 0.5);
      const [adjustedL] = adjustedColor.lch();
      adjustedColor = Number.isNaN(h)
        ? chroma.lch(adjustedL, reducedChroma, 0)
        : chroma.lch(adjustedL, reducedChroma, h);
    }

    return adjustedColor.hex();
  } catch {
    // If adjustment fails, return original
    return color;
  }
}

/**
 * Analyzes a color and returns APCA contrast information along with the appropriate
 * theme class to use. If the color fails contrast checks and autoAdjust is true,
 * the color will be adjusted to the nearest passing value.
 *
 * @param color - The background color to analyze (any valid CSS color)
 * @param options - Configuration options for contrast checking
 * @returns ContrastResult with color, theme class, and contrast information
 *
 * @example
 * ```ts
 * // Basic usage - returns theme class and potentially adjusted color
 * const result = getColorWithContrast('#ff6600');
 * // result.color - the color to use (may be adjusted)
 * // result.themeClass - 'theme-light' or 'theme-dark'
 *
 * // With options
 * const result = getColorWithContrast('#ff6600', {
 *   level: 'large',
 *   autoAdjust: false
 * });
 * ```
 */
export function getColorWithContrast(
  color: string,
  options: ContrastOptions = {}
): ContrastResult {
  const { level = 'body', autoAdjust = true } = options;

  // Validate color
  if (!chroma.valid(color)) {
    // Return defaults for invalid color
    return {
      originalColor: color,
      color: color,
      themeClass: THEME_CLASS_LIGHT,
      textColor: TEXT_COLOR_DARK,
      contrastLc: 0,
      wasAdjusted: false,
      passesContrast: false,
    };
  }

  const minContrastLc = getMinContrastLc(level);
  const { textColor, themeClass, contrastLc } = getBestTextColor(color);
  const passesContrast = contrastLc >= minContrastLc;

  // If passes or no auto-adjust, return as-is
  if (passesContrast || !autoAdjust) {
    return {
      originalColor: color,
      color: chroma(color).hex(),
      themeClass,
      textColor,
      contrastLc,
      wasAdjusted: false,
      passesContrast,
    };
  }

  // Adjust color to meet contrast
  const adjustedColor = adjustColorForContrast(color, textColor, minContrastLc);
  const adjustedContrastLc = getContrastAPCA(textColor, adjustedColor);

  return {
    originalColor: color,
    color: adjustedColor,
    themeClass,
    textColor,
    contrastLc: adjustedContrastLc,
    wasAdjusted: true,
    passesContrast: adjustedContrastLc >= minContrastLc,
  };
}

/**
 * Checks APCA contrast of a color against both light and dark text colors.
 *
 * @param color - The background color to check
 * @param options - Configuration options (level)
 * @returns Object with pass status and Lc values for both text colors
 */
export function checkContrastBoth(
  color: string,
  options: Pick<ContrastOptions, 'level'> = {}
): {
  passesWithLightText: boolean;
  passesWithDarkText: boolean;
  contrastWithLight: number;
  contrastWithDark: number;
  minRequired: number;
} {
  const { level = 'body' } = options;
  const minContrastLc = getMinContrastLc(level);

  if (!chroma.valid(color)) {
    return {
      passesWithLightText: false,
      passesWithDarkText: false,
      contrastWithLight: 0,
      contrastWithDark: 0,
      minRequired: minContrastLc,
    };
  }

  const contrastWithLight = getContrastAPCA(TEXT_COLOR_LIGHT, color);
  const contrastWithDark = getContrastAPCA(TEXT_COLOR_DARK, color);

  return {
    passesWithLightText: contrastWithLight >= minContrastLc,
    passesWithDarkText: contrastWithDark >= minContrastLc,
    contrastWithLight,
    contrastWithDark,
    minRequired: minContrastLc,
  };
}
