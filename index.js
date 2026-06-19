/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  if (type === EventType.ACTION_PRESS && pressAction?.id === 'default') {
    console.log('User pressed notification', notification);
  }
});
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
