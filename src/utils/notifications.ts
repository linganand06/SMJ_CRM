import notifee, { TimestampTrigger, TriggerType, RepeatFrequency } from '@notifee/react-native';

export async function requestNotificationPermission() {
  await notifee.requestPermission();
}

export async function scheduleFollowUpNotification() {
  await requestNotificationPermission();

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'followups',
    name: 'Follow-up Notifications',
  });

  // Set exact time to 9:00 AM today
  const scheduledTime = new Date();
  scheduledTime.setHours(9, 0, 0, 0); // 09:00:00

  // If 9:00 AM has already passed today, set it for tomorrow at 9:00 AM
  if (scheduledTime.getTime() <= Date.now()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: scheduledTime.getTime(),
    repeatFrequency: 1, // RepeatFrequency.DAILY (1 is the enum value for DAILY)
  };

  // Schedule the repeating notification
  await notifee.createTriggerNotification(
    {
      title: 'Daily Follow-up Reminder',
      body: 'Check your scheduled follow-ups for today!',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
      },
    },
    trigger,
  );

  console.log(`Daily notification scheduled starting at: ${scheduledTime.toLocaleString()}`);
}

export async function displayImmediateNotification() {
  await requestNotificationPermission();

  const channelId = await notifee.createChannel({
    id: 'followups',
    name: 'Follow-up Notifications',
  });

  await notifee.displayNotification({
    title: 'Follow-up Reminder',
    body: 'You have a follow-up scheduled for today (2:59 PM)!',
    android: {
      channelId,
      smallIcon: 'ic_launcher',
    },
  });
}
