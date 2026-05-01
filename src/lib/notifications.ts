// Run in Supabase SQL editor:
// ALTER TABLE profiles
//   ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false,
//   ADD COLUMN IF NOT EXISTS notification_time text DEFAULT '20:00';

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_MESSAGES = [
  "How's your thinking today?",
  "Did you do something yourself today?",
  "Take a moment to log your thinking.",
  "What did your brain do on its own today?",
  "Any wins to log? Even small ones count.",
  "How intentional was your AI use today?",
  "Your streak is waiting — anything to log?",
];

// Set notification display behavior
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// Replace notification content with random message at delivery time
Notifications.addNotificationReceivedListener((notification) => {
  // Pick a random message
  const randomMessage =
    NOTIFICATION_MESSAGES[
      Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)
    ];

  // Schedule a new local notification immediately with the random message
  Notifications.scheduleNotificationAsync({
    content: {
      title: notification.request.content.title || 'Firsthand',
      body: randomMessage,
      sound: false,
      data: notification.request.content.data,
    },
    trigger: null, // null means immediate delivery
  });
});

/**
 * Request notification permission from the user.
 * Note: This function intentionally returns false for non-iOS platforms as the app
 * is iOS-first and Android support is planned for a future phase.
 * Callers like ProfileScreen.tsx and OnboardingScreen.tsx are expected to handle
 * a false return appropriately (skip notification setup or show informational alerts).
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleDaily = async (time: string): Promise<void> => {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) {
    console.error('Invalid notification time:', time);
    throw new Error(`Invalid notification time: ${time}`);
  }

  try {
    // Cancel any existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule with a placeholder body - the actual message will be
    // randomly selected at delivery time by the notification handler
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Firsthand',
        body: 'Time to log your thinking',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (error) {
    console.error(`Failed to schedule notification for ${time}:`, error);
    throw error;
  }
};

export const cancelNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
