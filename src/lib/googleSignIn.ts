export interface GoogleSignInResult {
  data?: {
    idToken?: string;
  };
}

export const GoogleSignin = {
  configure: (_config: Record<string, unknown>) => {},
  hasPlayServices: async () => true,
  signIn: async (): Promise<GoogleSignInResult> => {
    throw new Error('Google Sign In is not available in Expo Go. Use a development build.')
  },
};
