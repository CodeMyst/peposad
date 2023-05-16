import { Client, Intents } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import config from "./config.json" assert { type: "json" };
import { readFileSync } from "fs";

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const insults = readFileSync("insults.txt").toString().split("\n");
const games = readFileSync("games.txt").toString().split("\n");

let voiceConnection;

let timeSinceLastMessage;

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    setInterval(randomMessage, 5 * 60 * 1000);

    randomGame();
});

client.on("interactionCreate", async interaction => {
    // ignore non command interaction
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "sad") {
        await interaction.reply(config.sadEmote);
    } else if (commandName === "happy") {
        await interaction.reply(config.happyEmote);
    }
});

client.on("messageCreate", ctx => {
    // ignore bot messages
    if (ctx.author.bot) return;

    if (ctx.content.toLowerCase().includes("kako")) {
        ctx.channel.send("kako?");
    }

    // random chance to send the emote on every message
    const rnd = Math.random();

    if (rnd < 0.01) {
        ctx.channel.send(config.sadEmote);
    } else if (rnd < 0.011) {
        ctx.channel.send(config.happyEmote);
    }
});

const randomMessage = async () => {
    if (timeSinceLastMessage) {
        const diff = Math.abs(new Date() - timeSinceLastMessage);

        if (diff <= 24 * 60 * 60 * 1000) return;
    }

    // random chance to send a message
    let rnd = Math.random();

    if (rnd < 0.005) {
        // either send a random insult or a random game
        rnd = Math.random();

        if (rnd < 0.5) {
            randomGame();
        } else {
            await randomInsult();
        }

        timeSinceLastMessage = new Date();
    }
};

const randomInsult = async () => {
    let channel = client.channels.cache.get(config.generalChannel);

    await channel.guild.members.fetch();
    const randomUser = channel.guild.members.cache.random().user;
    const rnd = Math.random();
    const randomInsult = insults[Math.floor(rnd * (insults.length - 1))];

    channel.send(`${randomUser} is a ${randomInsult} ${config.laughEmote}`);
};

const randomGame = () => {
    let channel = client.channels.cache.get(config.generalChannel);
    let voiceChannel = client.channels.cache.get(config.voiceChannel);

    const rnd = Math.random();
    const randomGame = games[Math.floor(rnd * (games.length - 1))];

    channel.send(`oće neko ${randomGame}?`);

    voiceConnection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
    });

    setTimeout(() => {
        voiceConnection.destroy();
    }, 30 * 60 * 1000);
};

client.login(config.token);
