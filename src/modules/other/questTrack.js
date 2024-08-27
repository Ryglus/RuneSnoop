const fs = require('fs');
const cron = require('node-cron');
const { abbreviateNumber } = require(modules.Util);

class QuestTracker {
    constructor(data) {
        this.questListPrices = JSON.parse(fs.readFileSync('./src/data/lists/questListPrices.json'));
        this.questList = JSON.parse(fs.readFileSync('./src/data/lists/questList.json'));
        this.track(data);
    }

    async track(data) {
        const quests = data.quests;
        const available = [];
        const finished = [];
        const mini = [];
        for (const [quest, status] of Object.entries(quests)) {
            if (this.questList.MiniQuests.find(q => q.name === quest) && status !== 2) {
                mini.push({
                    quest,
                    status,
                    price: this.questListPrices[quest]?.price,
                    colour: this.questListPrices[quest]?.colour
                });
            } else {
                switch (status) {
                    case 0:
                    case 1:
                        available.push({
                            quest,
                            status,
                            price: this.questListPrices[quest]?.price,
                            colour: this.questListPrices[quest]?.colour
                        });
                        break;
                    case 2:
                        finished.push(quest);
                        break;
                    default:
                        console.error(`Invalid status for quest ${quest}: ${status}`);
                }
            }
            
        }

        // Sort available quests with undefined price to be at the bottom
        available.sort((a, b) => {
            if (a.price === undefined && b.price === undefined) {
                return 0;
            } else if (a.price === undefined) {
                return 1;
            } else if (b.price === undefined) {
                return -1;
            } else {
                return 0;
            }
        });

        this.sendToDiscord(finished, available,mini);
    }

    async sendToDiscord(finishedQuests, availableQuests,MiniQuests) {
        const channelID = "1248964641351274596";
        const channel = await client.channels.cache.find(channel => channel.id === channelID);

        if (!channel) {
            console.error(`Channel with ID ${channelID} not found`);
            return;
        }

        // Fetch all messages in the channel
        const messages = await channel.messages.fetch();

        // Filter messages with the same title
        const existingMessages = messages.filter(msg => {
            const messageTitle = msg.content.split("\n")[0].substring(2);
            return messageTitle === "Finished Quests" || messageTitle === "Available Quests" || messageTitle === "Mini Quests";
        });

        const sortedQuests = [
            { title: "Finished Quests", quests: finishedQuests, colour: "green" },
            { title: "Available Quests", quests: availableQuests, colour: "yellow" },
            { title: "Mini Quests", quests: MiniQuests, colour: "yellow" }
        ];

        let totalBlocks = 0;
        for (const questCategory of sortedQuests) {
            let messageContent = "";

            if (questCategory.title === "Available Quests" || questCategory.title === "Mini Quests") {
                messageContent = questCategory.quests.map(q => {
                    let questText = q.quest;
                
                    if (questCategory.title === "Available Quests" || questCategory.title === "Mini Quests") {
                        if (q.colour) {
                            questText = `\u001b[38;5;${this.getColorCode(q.colour)}m${q.quest}`;
                        } else if (q.status == 1) {
                            questText = `\u001b[33m${q.quest}`;
                        } else if (q.status == 2) {
                            questText = `\u001b[32m${q.quest}\u001b[0m`;
                        }
                        
                        if (q.price !== undefined && q.price !== null) {
                            questText += `: ${abbreviateNumber(q.price, true)}`;
                        }
                    } else {
                        // Applying green color for finished quests
                        questText = `\u001b[32m${q}\u001b[0m`;
                    }
                
                    // Reset color code
                    questText += '\u001b[0m';
                
                    return questText;
                }).join('\n');
            } else {
                messageContent = questCategory.quests.map(q => {
                    // Applying green color for finished quests
                    return `\u001b[32m${q}\u001b[0m`;
                }).join('\n');
            }

            // Split the message content if it exceeds 2000 characters
            const messageChunks = this.splitMessageContent(messageContent, 2000 - (`# ${questCategory.title}\n\`\`\`ansi\n`.length + 4));

            // Edit or send new messages in the correct order (reverse the chunks)
            const reversedChunks = messageChunks.reverse();
            for (let i = messageChunks.length - 1; i >= 0; i--) {
                const chunk = reversedChunks[i]; // Adjust index to start from 0
                const existingMessage = existingMessages.at(existingMessages.size - totalBlocks++ - 1); // Calculate index for existing message

                if (existingMessages.size >= totalBlocks && existingMessages.size > 0) {
                    await existingMessage.edit(`# ${questCategory.title}\n\`\`\`ansi\n${chunk}\`\`\``);
                } else {
                    console.log("new");
                    await channel.send(`# ${questCategory.title}\n\`\`\`ansi\n${chunk}\`\`\``);
                }
            }
        }
        if (existingMessages.size > totalBlocks) {
            await channel.bulkDelete(existingMessages.size - totalBlocks);
        }
    }

    // Function to split a string into chunks of a specified maximum length
    splitMessageContent(content, maxLength) {
        const lines = content.split('\n');
        const chunks = [];
        let currentChunk = [];

        for (const line of lines) {
            if ((currentChunk.join('\n') + '\n' + line).length > maxLength) {
                chunks.push(currentChunk.join('\n'));
                currentChunk = [line];
            } else {
                currentChunk.push(line);
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
        }

        return chunks;
    }

    getColorCode(colorName) {
        switch (colorName) {
            case "red":
                return 31; // ANSI color code for red
            case "blue":
                return 34; // ANSI color code for blue
            case "green":
                return 32; // ANSI color code for green
            // Add more cases for other colors as needed
            default:
                return null; // Return null for unknown colors
        }
    }
}

module.exports = QuestTracker;