const { Client, Intents } = require("discord.js");
const { token, channel, sadEmote, happyEmote } = require("./config.json");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// list of times when the bot should send the emote
const times = [
    [1, 9.00],
    [1, 14.00],

    [2,  9.00],
    [2, 12.00],

    [3,  12.00],

    [4, 14.15],
    [4, 16.00],

    [5, 15.00]
];

const classes = [
    "OS2 - P",
    "RM - P",

    "PRIS - P",
    "NWP - PV",
    
    "NWP - P",
    
    "OR - P",
    "OS2 - PV",

    "OR - PV"
];

// channel where the bot sends the emotes
let chan;

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);

    // load the channel
    chan = client.channels.cache.get(channel);

    // check the times every 45secs
    setInterval(checkTime, 45 * 1000);
});

client.on("interactionCreate", async interaction => {
    // ignore non command interaction
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "sad") {
        await interaction.reply(sadEmote);
    } else if (commandName === "happy") {
        await interaction.reply(happyEmote);
    }
});

client.on("messageCreate", ctx => {
    // ignore bot messages
    if (ctx.author.bot) return;

    // random chance to send the emote on every message

    const rnd = Math.random();

    console.log(rnd);

    if (rnd < 0.01) {
        ctx.channel.send(sadEmote);
    }  else if (rnd < 0.011) {
        ctx.channel.send(happyEmote);
    }
});

const checkTime = () => {
    const now = new Date();
    // +1 to convert from UTC to CET
    // TODO: convert to CET/CEST (daylight savings)
    const nowtime = (now.getUTCHours()+2) + "." + now.getUTCMinutes();
    console.log("now: " + parseFloat(nowtime));

    for (let i = 0; i < times.length; i++) {
        const time = times[i];
        const day = time[0];
        const classtime = time[1];

        if (day !== now.getDay()) continue;

        console.log("class check: " + parseFloat(classtime));

        const subject = classes[i];

        if (parseFloat(nowtime) === parseFloat(classtime)) {
            console.log("peposad");
            chan.send(sadEmote + "  " + subject);
        }
    }
};

client.login(token);
