const { SlashCommandBuilder } = require('discord.js');
const speakeasy = require('speakeasy');
require('dotenv').config(); // Load environment variables from .env

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auth')
        .setDescription('Generate TOTP using a secret from the environment'),
    async execute(interaction) {
        // Get the secret from .env
        const secret = process.env.TOTP_SECRET;
       
        // Generate the TOTP using the secret
        const totpCode = speakeasy.totp({
            secret: secret,
            encoding: 'base32', // Ensure the secret is in base32 encoding
        });

        // Reply with the TOTP code, making the message ephemeral (visible only to the user)
        await interaction.reply({
            content: `TOTP code for is: **${totpCode}**`,
            ephemeral: true
        });
    }
};
