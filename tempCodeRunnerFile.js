require('dotenv/config');
const { Client } = require('discord.js');
const {OpenAI} = require('openai');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

client.on('ready', () => {
    console.log('the bot is online.');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['1235176791669215304'];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
})


async function receiveAiReply(role, message)
{
    try 
    {        
        let conversation=[];
        conversation.push({
        role: 'system',
        content: 'discord bot with different personas depending on user input. Now you are: '+role+' and dont put your name at the start, you already have identification!',
    });

    let prevMessages = await message.channel.messages.fetch({ lmit: 10});
    prevMessages.reverse();

    prevMessages.forEach((msg) =>{
        if(msg.author.bot && msg.author.id !== client.user.id) return;
        if(msg.content.startsWith(IGNORE_PREFIX)||msg.content.startsWith('/image')||msg.content.startsWith('/roll')) return;
        messageContent=msg.content;
        if(msg.content.startsWith('/funfact ')) 
            {
                messageContent="Message to Andian "+messageContent.slice(9).trim();
                
            }
        else
        {
            if(msg.author.id !== client.user.id) messageContent="Message to DireChatBOT (or other users) "+messageContent;
        }
        
        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if(msg.author.id === client.user.id)
            {
                conversation.push(
                    {
                        role:'assistant',
                        name: username,
                        content: messageContent,
                    });
                    return;
            }
        conversation.push({
            role: 'user',
            name: username,
            content: messageContent,
        })
        });

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        });
        return response;
    } catch(error)
    {
        console.error('OpenAI Error:\n', error);
    }
    
    
}


async function receiveAiImage(promptText)
{
    try 
    {
        const response= await openai.images.generate({
            model:"dall-e-3",
            prompt:promptText,
            size:"1024x1024",
            n:1,
            
        });
        return response;
    } catch(error)
    {
        console.error('OpenAI Error:\n', error);
    }
    
    
}


client.on('messageCreate', async (message) => 
{
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    //Roll dice command
    if (message.content.startsWith('/roll')) 
        {
        // Extract the number of sides from the message
        const args = message.content.split(' ');
        let sides = parseInt(args[1]);

        // Default to 6 sides if no valid number is provided
        if (isNaN(sides) || sides < 1) {
            sides = 6;
        }

        // Roll the die
        const roll = Math.floor(Math.random() * sides) + 1;

        // Send the result as a reply
        message.reply(`You rolled a ${roll} (1-${sides})`);
        return;
    }

    //Random fun fact as a weird victorian historian
    if(message.content.startsWith('/funfact '))
    {
        const text= message.content.slice(9).trim();

        if(text.length==0)
            {
                message.reply('Sorry but I shall not give you a fun fact is thou not express the field of interest!');
                return;
            }
        else
        {
            const response = await receiveAiReply('You are a Andian a weird mean victorian historian giving a fun fact, you are also quite condenscending.', message);
            if(response==null)
            {
                message.reply("Sorry there was an error with my artificial intelligence, please try again ");
            }
            else
            {
                message.reply(response.choices[0].message.content);
            }
            
            return;
        }
    }

    if(message.content.startsWith('/image '))
        {
            const text= message.content.slice(7).trim();
            if(text.length==0)
            {
                message.reply('Please give me a prompt to generate an image!');
                return;
            }
            else
            {
                const response= await receiveAiImage(text);
                if(response==null)
                {
                    message.reply("Sorry there was an error with my artificial intelligence, please try again");
                }
                else
                {
                    message.reply("Sure here is an image of: "+text+response.data[0].url);
                }
                return;
            }
        }


    //Reply to message using AI
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;
    else
    {
        const response = await receiveAiReply('You are DireChatBOT a friendly discord bot!', message);
    
        if(response==null)
            {
                message.reply(" Sorry there was an error with my artificial intelligence, please try again. ");
            }
            else
            {
                message.reply(response.choices[0].message.content);
            }
            
            return;
    }
        
    
});

client.login(process.env.TOKEN);