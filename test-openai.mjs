import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  console.log('API KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('Starting call to OpenAI (gpt-4o-mini)...');
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'gpt-4o-mini',
    });
    console.log('SUCCESS:', completion.choices[0].message.content);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
test();
