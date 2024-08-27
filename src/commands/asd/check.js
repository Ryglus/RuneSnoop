const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check')
        .setDescription('Check Old School RuneScape account stats')
        // Add your command options here if needed
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The RuneScape username to check')
                .setRequired(true)),
    async execute(interaction) {
        // Add your command execution logic here
        const username = interaction.options.getString('username');
        // Your code to check the RuneScape account stats
        interaction.reply(`Checking stats for ${username}...`);
    }
};
