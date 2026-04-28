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
                        chat: chatId, // Changed from chatId to chat to match the schema
                        user: socket.user._id,
                        sender: 'user',
                    });
                    return (await Message.find({
                        chat: chatId, // Changed from chatId to chat to match the schema
                    }).sort({createdAt: -1}).limit(20).lean()).reverse(); 
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
 
                const stm =chatHistory.map((item)=>{
                    return {
                        role:item.sender,
                        parts: [
                            { text: item.content }
                        ],
                    }
                });

                // Filter out undefined text from older Pinecone records
                const retrievedTexts = VectorHistory.matches
                    .map((match) => match.metadata?.text)
                    .filter(Boolean) // removes undefined/null
                    .join("\n");

                // Inject the LTM context as a System Instruction instead of modifying the user's prompt.
                // This tells Gemini "You DO have memory, and here it is" rather than letting it dismiss the user's prompt.
                let systemContext = "";
                if (retrievedTexts) {
                    systemContext = `You are a helpful AI assistant with access to a database of your past conversations with this user. 
Here are relevant snippets from your past conversations with this user:
${retrievedTexts}

IMPORTANT: You DO have memory. If the user asks about a past conversation, use the snippets above to answer them. DO NOT say you cannot recall past conversations.`;
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
            }
        });

        
    })
    
}   

module.exports = {initSocketServer};
