import { useWindowDimensions } from 'react-native';

// Design base size (iPhone 11 / 375 x 812). Phone ki screen is ke hisab se chhoti ya badi hogi.
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function useResponsive() {
  // useWindowDimensions screen size badalne par khud update hota hai
  const { width, height } = useWindowDimensions();

  // Width ke hisab se (horizontal spacing, width, border radius)
  const scale = (size) => (width / BASE_WIDTH) * size;

  // Height ke hisab se (vertical spacing, height)
  const verticalScale = (size) => (height / BASE_HEIGHT) * size;

  // Fonts ke liye: poora scale nahi, sirf half (bohot bara ya bohot chhota text na ho)
  const moderateScale = (size, factor = 0.5) =>
    size + (scale(size) - size) * factor;

  return { width, height, scale, verticalScale, moderateScale };
}