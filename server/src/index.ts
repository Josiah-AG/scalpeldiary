import app from './app';
import { startNotificationScheduler } from './services/dailyNotifications';
import { startOutbox } from './services/outbox';
app.listen(process.env.PORT || 3000, () => {
 console.log('ScalpelDiary backend ready');
 startNotificationScheduler(); startOutbox();
});
