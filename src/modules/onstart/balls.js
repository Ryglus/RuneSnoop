const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs'); const path = require('path');
const imageToBase64 = require('image-to-base64');


class BallsBoard {
    constructor() {

        this.channelId = "1266886306441465866";
        this.boardSize = 6; // Set to 6x6
        this.cellSize = 270;
        this.grid = JSON.parse(fs.readFileSync('src/assets/balls.json'))

        this.setupListeners();
        this.sendInitialBoard();
    }

    setupListeners() {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            
            interaction.reply({ content: 'Cell toggled!', ephemeral: true });

            const index = Number(interaction.customId.split('_')[1]);
            const row = Math.floor(index / this.boardSize);
            const col = index % this.boardSize;
            await this.toggleCell(row, col);
            const channel = await client.channels.fetch(this.channelId);
            const messages = await channel.messages.fetch();
            const bingoMessage = messages.find(msg => msg.attachments.size > 0);
            if (bingoMessage) {
                const attachment = await this.createBoardImage();
                const buttons = this.createButtons();

                await bingoMessage.edit({ files: [attachment], components: buttons });
            }
        });
        client.on('messageCreate', async (message) => {
            if (message.channel.id !== this.channelId || !message.attachments.size ) return;

            const attachment = message.attachments.first();
            if (attachment.contentType.startsWith('image/')) {
                await this.updateBoardImage(attachment.url);
                message.delete();
                await this.sendInitialBoard();
            }
        });
    }

    async sendInitialBoard() {
        const channel = await client.channels.fetch(this.channelId);
        const messages = await channel.messages.fetch();

        const attachment = await this.createBoardImage();
        const buttons = this.createButtons();

        if (messages.some(msg => msg.attachments.size > 0 && msg.author.bot)) {
            await messages.first().edit({ files: [attachment], components: buttons });
        } else {
            await channel.send({ files: [attachment], components: buttons });
        }
    }

    toggleCell(row, col) {
        this.grid[row][col] = !this.grid[row][col];
        fs.writeFileSync('src/assets/balls.json', JSON.stringify(this.grid, null, 2));
    
    }

    createButtons() {
        const rows = [];
        let buttonCounter = 0;
        var raow = new ActionRowBuilder();
        this.grid.forEach(row => {
            
            row.forEach(cell => {

                if (!cell) {
                    raow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`btn_${buttonCounter}`)
                            .setLabel(`${buttonCounter+1}`)
                            .setStyle(1)
                    );
                }
                buttonCounter++;
                if (raow.components.length === 5) {

                    rows.push(raow);
                    raow = new ActionRowBuilder();
                }

            });
            if (rows.length <=4 && this.grid.length == this.grid.indexOf(row)+1 && raow.components.length > 0) {

                rows.push(raow);
            }
        });
        return rows;
    }


    async createBoardImage() {
        const bingoboard = path.join('src/assets/updated_stage_2.png');
        const ballspath = path.join('src/assets/Untitled.png');
        const bingoboardimg = await loadImage(bingoboard);
        const ballsimg = await loadImage(ballspath);
        const canvas = createCanvas(bingoboardimg.width, bingoboardimg.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bingoboardimg, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';

        ctx.strokeStyle = '#000000';
        let start = { x: 45, y: 560 }, gap = 20;


        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                
               
                
                if (this.grid[i][j]) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.drawImage(ballsimg , start.x + j * this.cellSize + (gap * j) + (j * 2), i * this.cellSize + start.y + (gap * i) + (i * 3), this.cellSize, this.cellSize);
                } else {
                    ctx.font = '60px "Cinzel Decorative"';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Light grey
                    ctx.fillText((i*6)+j+1, start.x + j * this.cellSize + (gap * j) + (j * 2), i * this.cellSize + start.y + (gap * i) + (i * 3));
                }
            }
        }

        const buffer = canvas.toBuffer('image/png');

        return new AttachmentBuilder(buffer, { name: 'board.png' });
    }

    async updateBoardImage(imageUrl) {
        try {
            let response = await imageToBase64(imageUrl);
            let buffer = Buffer.from(response, 'base64');
            fs.writeFileSync(path.join('src/assets/updated_stage_2.png'), buffer);
            console.log('Image saved successfully');
        } catch (error) {
            console.error('Error updating board image:', error);
        }
    }


}

new BallsBoard();