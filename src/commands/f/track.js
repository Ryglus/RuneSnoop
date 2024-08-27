const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('track')
        .setDescription('Track changes in Old School RuneScape accounts'),
    async execute(interaction) {
        // Your code to track changes in RuneScape accounts
        interaction.reply('Tracking RuneScape account changes...');
    }
};
