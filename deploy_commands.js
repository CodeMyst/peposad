const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, id, server } = require("./config.json");

const commands = [
    new SlashCommandBuilder().setName("sad").setDescription("sad"),
    new SlashCommandBuilder().setName("happy").setDescription("happy")
].map(c => c.toJSON());

const rest = new REST({ version: "9" }).setToken(token);

rest.put(Routes.applicationGuildCommands(id, server), { body: commands })
    .then(() => console.log("registered commands"))
    .catch(console.error);
