import { Client, Events, GatewayIntentBits, Message, type GuildBasedChannel, , type GuildTextBasedChannel } from "discord.js";
import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';

const { TOKEN, SERVER_ID, SAD_EMOTE, HAPPY_EMOTE, LAUGH_EMOTE, VOICE_CHANNEL, TEXT_CHANNEL } = process.env;

const client = new Client(
   {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.MessageContent,
        ]
    }
);

const INSULTS_FILE = Bun.file('./insults.txt');
const GAMES_FILE = Bun.file('./games.txt');

const INSULTS = (await INSULTS_FILE.text()).split('\n');
const GAMES = (await GAMES_FILE.text()).split('\n');

const GAME_REGEX = /@(.*) ajmo ([a-zA-Z0-9_ ]*)/;
const EMOJI_REGEX = /((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu;

let textChannel: GuildTextBasedChannel | undefined;
let voiceChannel: GuildBasedChannel | undefined;

let timeSinceLastRandomMessage: Date | undefined;

client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}!`);

    const guild = client.guilds.cache.get(SERVER_ID!);
    if (!guild) return;

    textChannel = guild.channels.cache.get(TEXT_CHANNEL!) as GuildTextBasedChannel;
    voiceChannel = guild.channels.cache.get(VOICE_CHANNEL!);

    setInterval(sendRandomMessage, 5 * 60 * 1000);

    startRandomGame();
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'sad') {
        await interaction.reply(SAD_EMOTE!);
    } else if (interaction.commandName === 'happy') {
        await interaction.reply(HAPPY_EMOTE!);
    }
});

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    // if the message contains an emote, react with it
    const emotes = content.match(EMOJI_REGEX);
    if (emotes) {
        message.react(emotes[0]);
    }

    // kako?
    if (content.includes('kako') || content.includes('kak0')) {
        message.reply('kako?');
    } else if (content.includes('gde')) {
        message.reply('gde?');
    } else if (content.includes('koliko')) {
        message.reply('koliko?');
    }

    // random chance to reply with a sad/happy emote
    const rnd = Math.random();
    if (rnd < 0.01) {
        message.reply(SAD_EMOTE!);
    } else if (rnd < 0.011) {
        message.reply(HAPPY_EMOTE!);
    }

    // handle starting and registering new games
    if (message.mentions.has(client.user!)) {
        startNewGame(message, content);
    }
});

const startNewGame = (message: Message<boolean>, content: string) => {
    const match = GAME_REGEX.exec(content);

    if (!match) return;

    const game = match[2];

    message.reply(`ajmo ${game}`);
    joinVoice();

    if (!GAMES.includes(game)) {
        addNewGame(game);
    }
};

const sendRandomMessage = async () => {
    if (timeSinceLastRandomMessage) {
        const diff = Math.abs(new Date().getTime() - timeSinceLastRandomMessage.getTime());

        if (diff <= 24 * 60 * 60 * 1000) return;
    }

    if (Math.random() < 0.005) {
        if (Math.random() < 0.5) {
            startRandomGame();
        } else {
            await randomInsult();
        }

        timeSinceLastRandomMessage = new Date();
    }
};

const startRandomGame = () => {
    const rnd = Math.random();
    const randomGame = GAMES[Math.floor(rnd * (GAMES.length - 1))];

    textChannel?.send(`oće neko ${randomGame}?`);

    joinVoice();
};

const randomInsult = async () => {
    if (!textChannel) return;

    await textChannel.guild.members.fetch();

    const randomUser = textChannel.guild.members.cache.random()?.user;
    if (!randomUser) return;

    const rnd = Math.random();
    const randomInsult = INSULTS[Math.floor(rnd * (INSULTS.length - 1))];

    textChannel.send(`${randomUser} is a ${randomInsult} ${LAUGH_EMOTE}`);
};

const addNewGame = (game: string) => {
    GAMES.push(game);
    const gamesText = GAMES.filter(g => g !== '').join('\n');

    Bun.write(GAMES_FILE, gamesText);
};

const joinVoice = () => {
    if (!voiceChannel) return;

    joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
    });

    setTimeout(() => {
        const connection = getVoiceConnection(SERVER_ID!);
        connection?.destroy();
    }, 30 * 60 * 1000);
};

client.login(TOKEN);
