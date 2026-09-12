/** Gratitude Circles uses the open-heart seed mark within the NAI family. */

export const NAI_PRODUCT_NAME = "Gratitude Circles";
export const NAI_ATTRIBUTION = "made with love by NAI";
export const NAI_PRINCIPLE =
  "NAI provides the stillness. Your life provides the colour.";
export const NAI_CORE_IDEA = "Notice. Appreciate. Integrate.";

/** Raster mark, black on transparent — for light surfaces. */
export const NAI_MARK_DARK_SRC = "/gratitude-logo.svg";
/** Raster mark, white on transparent — for dark surfaces. */
export const NAI_MARK_LIGHT_SRC = "/gratitude-logo-light.svg";

/** Petal count of the flower. Six, always. */
export const NAI_PETALS = 6;

/** Coordinate space the geometry below is drawn in (square, origin top-left). */
export const NAI_GEOMETRY_SIZE = 100;
export const NAI_GEOMETRY_CENTER = NAI_GEOMETRY_SIZE / 2;

/** Radius of the ring that encloses the petals. */
export const NAI_RING_RADIUS = 46;

/**
 * One petal, pointing up, growing from the centre of the coordinate space.
 * Rotating it by 60° steps produces the flower.
 */
export const NAI_PETAL_PATH =
  "M50 50 C30 44 22 26 33 16 C41 9 49 16 50 24 C51 16 59 9 67 16 C78 26 70 44 50 50 Z";
