import { useFonts as useExpoFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';

export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  return { fontsLoaded, fontError };
}
