import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('API KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');

async function test() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('Starting call...');
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama-3.3-70b-versatile',
    });
    console.log('SUCCESS:', completion.choices[0].message.content);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
test();
