global.config = require("./config.json")
const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
global.client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences], partials: [
			Partials.User,
			Partials.Channel,
			Partials.GuildMember,
			Partials.Message,
			Partials.Reaction,
			Partials.GuildScheduledEvent,
			Partials.ThreadMember,]
});
const { registerFont } = require('canvas');
const fs = require('fs'), path = require('path');

global.modules = {};

registerFont(path.join(__dirname, 'src/assets/fonts/CinzelDecorative-Regular.ttf'), { family: 'Cinzel Decorative' });

client.commands = new Collection();

const modulesDir = path.join(__dirname, 'src');
client.on('ready', () => {
    console.log("READY!");
    loadModules(modulesDir)
    toLoad.forEach(filePath => {
        require(filePath);
    });
  });
// Function to load commands from directories (including subdirectories)
const loadCommands = (dir) => {
	const files = fs.readdirSync(dir, { withFileTypes: true });

	for (const file of files) {
		if (file.isDirectory()) {
			loadCommands(path.join(dir, file.name));
		} else if (file.name.endsWith('.js')) {
			const command = require(path.join(dir, file.name));
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${path.join(dir, file.name)} is missing a required "data" or "execute" property.`);
			}
		}
	}
};


// Function to load modules from directories (including subdirectories)
let toLoad = [];
const loadModules = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        if (file.isDirectory() && file.name !== "commands") {
            loadModules(path.join(dir, file.name));
        } else if (file.name.endsWith('.js')) {
            if (file.path.includes("onstart")) {
                if (!toLoad.includes(path.join(file.path, file.name))) {
                    toLoad.push(path.join(file.path, file.name));
                }
            } else {
                modules[file.name.replace(".js", "")] = path.join(dir, file.name);
            }
        }
    }
};

const commandsDir = path.join(__dirname, '/src/commands');

client.login(config.token);

loadCommands(commandsDir);

module.exports.client = client;

