const { TELEGRAM_TOKEN, OPENAI_API_KEY, BOT_NAME, CHAT_ID, AI_NAME } = require('./config.json');

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

const TG = require('telegram-bot-api');
const api = new TG({ token: TELEGRAM_TOKEN });
const mp = new TG.GetUpdateMessageProvider();

api.setMessageProvider(mp);
api.start() 
    .then(() => console.log('API is started')) 
    .catch(console.err);

const fs = require('fs');
let data = fs.readFileSync(`${__dirname}/data.txt`);

api.on('update', async update => {

    let content = update?.message?.text;

    if(!content) return;
    
    if(content.includes(BOT_NAME)) {

        if(update.message.chat?.id != CHAT_ID) return api.sendMessage({ 
            chat_id: update.message.chat.id, 
            text: "Je ne réponds pas dans ce groupe, désolé.",
            reply_to_message_id: update.message.message_id
        });

        content = content.trim().replace(new RegExp(BOT_NAME, 'g'), '');

        data += `\nHumain : ${content}`;

        const response = await openai.createCompletion({
            model: "text-davinci-002",
            prompt: data,
            temperature: 0.9,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: ['Humain']
        });

        const r = response.data.choices[0].text;

        data += r;

        fs.writeFileSync(`${__dirname}/data.txt`, data);
        
        api.sendMessage({ 
            chat_id: update.message.chat.id, 
            text: r.replace(`${AI_NAME} :`, ''),
            reply_to_message_id: update.message.message_id
        });
    };
});