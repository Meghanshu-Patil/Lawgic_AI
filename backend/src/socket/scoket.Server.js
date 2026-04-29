const {Server} = require('socket.io');
const {verify} = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const User = require('../models/user.odels');
const {generateResponse} = require('../services/ai-services');
const Message = require('../models/message.modle');
const {createMemory,queryMemory} = require('../services/pinecone');
const {generateVector} = require('../services/ai-services');

const cookie = require('cookie');


function initSocketServer(httpServer){
    const io = new Server(httpServer,{});

    
    io.use(async (socket, next) => {
        // Headers use lowercase 'cookie' by default
        // const cookieString = socket.handshake.headers?.cookie || socket.handshake.headers?.Cookie || '';
        const cookies = cookie.parse(socket.handshake.headers?.cookie || '');

        if (!cookies.Token) return next(new Error("Authentication failed no cookie found"));

        try {
            const decodedToken = jwt.verify(cookies.Token, process.env.JWT_SECRET);
            // Wait for the DB query to finish, and use decodedToken._id (since Auth.controler.js uses _id)
            const user = await User.findById(decodedToken._id);
            
            if(!user) return next(new Error("Authentication failed"));
            
            socket.user = user;
            next();
        } catch (error) {
            console.error("Socket authentication error:", error.message);
            return next(new Error("Authentication failed invalid token"));
        }
        
    });

    io.on("connection",(socket) => {
      
        socket.on('message', async (message) => {
            console.log('Recived message:', message);

            // Extract the chat ID regardless of whether the frontend sends 'Chat', 'chatId', or 'chat'
            const chatId = message.chatId || message.Chat || message.chat;

            if (!chatId) {
                console.error("Missing chat ID in incoming message");
                return;
            }

            try {

                /* parallelize vector generation and DB operations */
                const vectorPromise = generateVector(message.content);
                const chatHistoryPromise = (async () => {
                    await Message.create({
                        content: message.content,
                        chat: chatId,
                        user: socket.user._id,
                        sender: 'user',
                        fileUrl: message.fileUrl,
                        mimeType: message.mimeType,
                    });
                    return (await Message.find({
                        chat: chatId,
                    }).sort({createdAt: -1}).limit(6).lean()).reverse();  
                })();

                const [vector, chatHistory] = await Promise.all([vectorPromise, chatHistoryPromise]);

                /* parallelize pinecone queries */
                const [VectorHistory] = await Promise.all([
                    queryMemory({
                        queryVector: vector, 
                        metadata: { user: socket.user._id }
                    }),
                    createMemory({
                        vector: vector,
                        messageId: `${chatId}-user-${message.id || Date.now()}`,
                        metadata: {
                            chatId: chatId,
                            user: socket.user._id,
                            text: message.content,
                            sender: 'user'
                        },
                    })
                ]);
 
                const stm = await Promise.all(chatHistory.map(async (item, index) => {
                    const part = { text: item.content };
                    
                    // Add file inlineData for the most recent message
                    if (item.fileUrl && item.mimeType && index === chatHistory.length - 1) {
                        try {
                            const fileResp = await fetch(item.fileUrl).then(res => res.arrayBuffer());
                            const base64Data = Buffer.from(fileResp).toString("base64");
                            return {
                                role: item.sender,
                                parts: [
                                    part,
                                    {
                                        inlineData: {
                                            mimeType: item.mimeType,
                                            data: base64Data
                                        }
                                    }
                                ]
                            };
                        } catch (err) {
                            console.error("Failed to fetch file for Gemini:", err);
                        }
                    }

                    return {
                        role: item.sender,
                        parts: [part],
                    };
                }));

                // Filter out undefined text from older Pinecone records
                const retrievedTexts = VectorHistory.matches
                    .map((match) => match.metadata?.text)
                    .filter(Boolean) // removes undefined/null
                    .join("\n");

                // Inject the LTM context alongside a strict Persona Prompt
                let systemContext = `You are Lawgic AI, an elite legal assistant. 
CRITICAL INSTRUCTIONS TO MINIMIZE TOKEN USAGE:
1. Be highly concise and direct. Do NOT use conversational filler words (e.g. "Certainly", "Here is").
2. Structure your answers using bullet points and short, punchy sentences.
3. Provide direct legal conclusions immediately.
4. Format your output strictly in Markdown.`;

                if (retrievedTexts) {
                    systemContext += `\n\nPast Memory Snippets for Context:\n${retrievedTexts}\n\nIMPORTANT: Use these snippets if the user asks about past conversations.`;
                }

                const response = await generateResponse(stm, systemContext);

                console.log('Response:', response);

                /* sending response back on socket connection immediately for faster UX */
                io.to(socket.id).emit('ai-response',{
                    content: response,
                    chatId: chatId, 
                }); 

                /* parallelize response vector generation and saving message to DB */
                const responseVectorPromise = generateVector(response);
                const dbMessagePromise = Message.create({
                    content: response,
                    chat: chatId, // Changed from chatId to chat to match the schema
                    user: socket.user._id,
                    sender: 'model',
                });

                const [responseVector] = await Promise.all([responseVectorPromise, dbMessagePromise]);

                /* save response vector to pinecone */
                await createMemory({
                    vector: responseVector,
                    messageId: `${chatId}-model-${Date.now()}`,
                    metadata: {
                        chatId: chatId,
                        user: socket.user._id,
                        text: response,
                        sender: 'model'
                    },
                });
            } catch (error) {
                console.error("Error processing message:", error);
                
                let fallbackMsg = "An internal error occurred while processing your request.";
                if (error.message && (error.message.includes("429") || error.message.includes("quota"))) {
                    fallbackMsg = "I apologize, but I am currently experiencing high traffic and have exceeded my rate limit. Please wait a moment and try again.";
                }
                
                io.to(socket.id).emit('ai-response', {
                    content: fallbackMsg,
                    chatId: chatId, 
                });
            }
        });
        
    });
    
}   

module.exports = {initSocketServer};
