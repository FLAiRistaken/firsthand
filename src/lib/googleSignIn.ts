export const GoogleSignin = {
  configure: (_config: Record<string, unknown>) => {},
  hasPlayServices: async () => true,
  signIn: async (): Promise<never> => {
    throw new Error('Google Sign In is not available in Expo Go. Use a development build.')
  },
};
