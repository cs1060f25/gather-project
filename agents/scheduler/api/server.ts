import express from 'express';
import bodyParser from 'body-parser';
import { schedulerRouter } from './scheduler.routes.js';
import { calendarRouter } from './calendar.routes.js';

const app = express();
app.use(bodyParser.json());

app.use('/api/schedule', schedulerRouter);
app.use('/api/calendar', calendarRouter);

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`Scheduler API listening on http://localhost:${PORT}`);
});
