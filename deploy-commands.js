const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('fs');
const path = require('path');
global.modules = {};
const commands = [];
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);





// Function to load modules from directories (including subdirectories)
const loadModules = (dir) => {
	const files = fs.readdirSync(dir, { withFileTypes: true });

	for (const file of files) {
		if (file.isDirectory()) {
			loadModules(path.join(dir, file.name));
		} else if (file.name.endsWith('.js')) {
			modules[file.name.replace(".js", "")] = path.join(dir, file.name);
		}
	}
};


const modulesDir = path.join(__dirname, 'src');
global.resources = path.join(__dirname, 'src/resources/');


loadModules(modulesDir)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} global application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully deployed ${data.length} global application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();