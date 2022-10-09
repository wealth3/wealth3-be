import express from 'express';
import { depositValidator } from './validator';

const app = express();
const port = 3001;

app.listen(port, () => {
  console.log(`Wealth3 BE running at http://localhost:${port}.`);
});

app.get('/create_validator', async (req, res) => {
  await depositValidator();
  res.status(200).send('Everything is fine!');
});