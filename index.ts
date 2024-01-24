import { Client, Events, GatewayIntentBits, Message, type GuildBasedChannel, type GuildTextBasedChannel } from "discord.js";
import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import sqlite3 from 'sqlite3';
import { open } from "sqlite";

const { TOKEN, SERVER_ID, SAD_EMOTE, HAPPY_EMOTE, LAUGH_EMOTE, PRAY_EMOTE, VOICE_CHANNEL, TEXT_CHANNEL } = process.env;

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

const GAME_REGEX = /@(.*) ajmo ([a-zA-Z0-9_ ]*)/;
const EMOJI_REGEX = /((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu;

let textChannel: GuildTextBasedChannel | undefined;
let voiceChannel: GuildBasedChannel | undefined;

let timeSinceLastRandomMessage: Date | undefined;

const db = await open({
    filename: './db/database.db',
    driver: sqlite3.Database
});

const seedDb = async () => {
    await db.exec('create table if not exists games (game TEXT not null unique)');
    await db.exec('create table if not exists insults (insult TEXT not null unique)');

    const games = (await GAMES_FILE.text()).split('\n').filter(i => i !== '');
    const insults = (await INSULTS_FILE.text()).split('\n').filter(g => g !== '');

    const gameCount = await db.get('select count(*) from games');

    if (gameCount && gameCount['count(*)'] !== 0) return;

    const gamesStmt = await db.prepare('insert or ignore into games (game) values (?)');
    const insultsStmt = await db.prepare('insert or ignore into insults (insult) values (?)');

    games.forEach(async g => {
        await gamesStmt.run(g);
    });

    insults.forEach(async i => {
        await insultsStmt.run(i);
    });
};

await seedDb();

client.once(Events.ClientReady, async (c) => {
    console.log(`Logged in as ${c.user.tag}!`);

    const guild = client.guilds.cache.get(SERVER_ID!);
    if (!guild) return;

    textChannel = guild.channels.cache.get(TEXT_CHANNEL!) as GuildTextBasedChannel;
    voiceChannel = guild.channels.cache.get(VOICE_CHANNEL!);

    setInterval(sendRandomMessage, 5 * 60 * 1000);

    await startRandomGame();
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'sad') {
        await interaction.reply(SAD_EMOTE!);
    } else if (interaction.commandName === 'happy') {
        await interaction.reply(HAPPY_EMOTE!);
    } else if (interaction.commandName === 'pray') {
        const verse = await getRandomBibleVerse();
        await interaction.reply(`${verse.reference}\n\n${verse.text}\n${PRAY_EMOTE}`);
    }
});

client.on(Events.MessageCreate, async (message) => {
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
    } else if (content.includes('ako')) {
        message.reply('**AKO**');
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
        await startNewGame(message, content);
    }
});

const startNewGame = async (message: Message<boolean>, content: string) => {
    const match = GAME_REGEX.exec(content);

    if (!match) return;

    const game = match[2];

    message.reply(`ajmo ${game}`);
    joinVoice();

    await addNewGame(game);
};

const sendRandomMessage = async () => {
    if (timeSinceLastRandomMessage) {
        const diff = Math.abs(new Date().getTime() - timeSinceLastRandomMessage.getTime());

        if (diff <= 24 * 60 * 60 * 1000) return;
    }

    if (Math.random() < 0.005) {
        const rnd = Math.floor(Math.random() * 3);

        switch (rnd) {
            case 1: await startRandomGame(); break;
            case 2: await randomInsult(); break;
            case 3: await sendRandomBibleVerse(); break;
        }

        timeSinceLastRandomMessage = new Date();
    }
};

const startRandomGame = async () => {
    const randomGame = (await db.get('select game from games order by random() limit 1'))['game'];

    textChannel?.send(`oće neko ${randomGame}?`);

    joinVoice();
};

const randomInsult = async () => {
    if (!textChannel) return;

    await textChannel.guild.members.fetch();

    const randomUser = textChannel.guild.members.cache.random()?.user;
    if (!randomUser) return;

    const randomInsult = (await db.get('select insult from insults order by random() limit 1'))['insult'];

    textChannel.send(`${randomUser} is a ${randomInsult} ${LAUGH_EMOTE}`);
};

const addNewGame = async (game: string) => {
    await db.run('insert or ignore into games (game) values (?)', game);
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

interface BibleVerse {
    reference: string;
    text: string;
}

const sendRandomBibleVerse = async () => {
    const verse = await getRandomBibleVerse();

    textChannel?.send(`${verse.reference}\n\n${verse.text}\n${PRAY_EMOTE}`);
};

const getRandomBibleVerse = async (): Promise<BibleVerse> => {
    const res = await fetch('https://bible-api.com/?random=verse');

    if (!res.ok) {
        return {
            reference: 'peposad 42:69',
            text: `In the swampy sanctum of peposad's server, let the ribbits of joy be your notification melody, and the leap of laughter your signature move. When faced with the glitches of life, may you find solace in the algorithm of amphibian absurdity. For in the pixelated pond of chat commands, the croak of camaraderie shall echo, and the lily pad of humor will be your sacred emoji. Hop into each day with a leap of faith, for FrogBot's blessings are as endless as the flies in the digital swamp!`
        };
    }

    return await res.json() as BibleVerse;
};

client.login(TOKEN);
