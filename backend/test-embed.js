require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({});
async function test() {
    try {
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: 'hello',
        });
        console.log(JSON.stringify(response, null, 2));
    } catch (err) {
        console.error(err);
    }
}
test();
