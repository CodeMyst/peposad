import { REST, Routes, SlashCommandBuilder } from "discord.js";

const COMMANDS = [
    new SlashCommandBuilder().setName('sad').setDescription('sad'),
    new SlashCommandBuilder().setName('happy').setDescription('happy'),
].map(c => c.toJSON());

const rest = new REST().setToken(process.env.TOKEN!);

await rest.put(Routes.applicationGuildCommands(process.env.APP_ID!, process.env.SERVER_ID!), { body: COMMANDS });

console.log('registered commands');
