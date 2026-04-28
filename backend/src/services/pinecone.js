// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Create a dense index with integrated embedding
const chatbotIndex = pc.Index("main-chatbot");


async function createMemory({ vector, metadata, messageId }) {

    try{
        await chatbotIndex.upsert({
            records: [{
                id: messageId,
                values: vector,
                metadata
            }]
        });
        console.log(`Successfully upserted record ${messageId} to Pinecone.`);
    }catch(err){
        console.error("Pinecone Upsert Error:", err);
        return { error: "Failed to create memory: " + err.message }
    }
    
}

async function queryMemory({queryVector, topK=5 , metadata}){
    try {

        const result = await chatbotIndex.query({
            vector:queryVector,
            topK:topK,
            filter: metadata,
            includeMetadata:true

            
        })
        return result
        
    } catch (error) {
        console.log(error);
        return { error: "Failed to query memory" + error.message}
    }
}


module.exports = { createMemory, queryMemory }
