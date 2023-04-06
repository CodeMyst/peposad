import { Client, Intents } from "discord.js";
import config from "./config.json" assert { type: "json" };
import { readFileSync } from "fs";

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const insults = readFileSync("insults.txt").toString().split("\n");

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    setInterval(randomlyInsult, 60 * 1000);
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

const randomlyInsult = async () => {
    let channel = client.channels.cache.get(config.generalChannel);

    // random chance to insult
    const rnd = Math.random();

    if (rnd < 0.01) {
        await channel.guild.members.fetch();
        const randomUser = channel.guild.members.cache.random().user;
        const randomInsult = insults[Math.floor(Math.random() * insults.length)];

        channel.send(`${randomUser} is a ${randomInsult} ${config.laughEmote}`);
    }
};

client.login(config.token);
