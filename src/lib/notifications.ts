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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleDaily = async (time: string): Promise<void> => {
  // Cancel any existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute)) {
    console.error('Invalid notification time:', time);
    return;
  }

  const randomMessage =
    NOTIFICATION_MESSAGES[
      Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)
    ];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Firsthand',
      body: randomMessage,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

export const cancelNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
