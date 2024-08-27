const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { RSExp, requestBase64ImageFromWiki, abbreviateNumber } = require(modules.Util);
const { createCanvas, loadImage, Image } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

class GoalTracker {
    constructor(data) {
        this.goals = JSON.parse(fs.readFileSync('./src/data/lists/goalList.json'));
        this.exp = new RSExp();
        this.trackGoals(data);
    }

    async trackGoals(data) {

        let goalDis = [];
        for (const goal of this.goals.goals) {
            let remainingXP;
            if (goal.list) {
                let asd = (goal.list.filter(g => g.level > data.skills.find(skill => skill.name === goal.skill).level)).sort((a, b) => a.level - b.level)[0]
                remainingXP = (this.exp.level_to_xp(asd.level) - data.skills.find(skill => skill.name === goal.skill).xp) / asd.rate;
            } else if (goal.table) {

            } else remainingXP = (this.exp.level_to_xp(goal.level) - data.skills.find(skill => skill.name === goal.skill).xp) / goal.rate;
            goalDis[goalDis.length] = await this.createCanvas(goal, remainingXP, data.skills.find(skill => skill.name === goal.skill).xp);
            
        }
        this.sendToDiscord(goalDis);
    }

    async createCanvas(goal, remainingXP, currentXP) {
        let ccheit = 120;
        if (goal.list) ccheit = 180;
        if (goal.table) ccheit = 120 + goal.table.height * 50 ;
        const canvas = createCanvas(700, ccheit);
        const ctx = canvas.getContext('2d');

        // Load skill image
        const skillImagePath = path.join('src/assets/skill', `${goal.skill.toLowerCase()}.png`);
        const skillImage = await loadImage(skillImagePath);

        const pedestalImage = await getRandomPedestalImage();

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 700, 250);
        gradient.addColorStop(0, '#281c26');
        gradient.addColorStop(1, '#212036');
        drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 20, gradient);

        // Draw skill image
        drawImagePixelPerfect(ctx, skillImage, 5, 5, 50, 50);

        if (goal.extra_image) {
            const pedestalX = 550;
            const pedestalY = 50;
            const pedestalWidth = pedestalImage.width / 3;
            const pedestalHeight = pedestalImage.height / 3;
            drawImagePixelPerfect(ctx, pedestalImage, pedestalX, pedestalY, pedestalWidth, pedestalHeight);

            const extraImageBase64 = await requestBase64ImageFromWiki(goal.extra_image);
            const extraImage = await base64ToImage(extraImageBase64);
            const extraImageX = pedestalX + (pedestalWidth / 2) - (extraImage.width / 6 / 2);
            const extraImageY = pedestalY - (extraImage.height / 6) + 10;
            drawImagePixelPerfect(ctx, extraImage, extraImageX - extraImage.width, extraImageY, extraImage.width * 2, extraImage.height * 2);
        }




        // Draw text
        ctx.fillStyle = '#D1D1D1'; // Light grey
        ctx.font = '38px "Cinzel Decorative"';
        ctx.textAlign = 'left';
        ctx.fillText(`${goal.skill}`, 60, 42);

        const totalXP = currentXP + remainingXP;
        const progress = currentXP / totalXP;

        let addbarwidth = 0;
        if (!goal.extra_image) addbarwidth = 70;
        // Draw progress bar background
        drawRoundedRect(ctx, 100 - addbarwidth, 70, (500 + addbarwidth * 2), 40, 10, '#555'); // Dark grey for background bar

        if (goal.list) {
            let x = 0;
            for (let i = 0; i < goal.list.length; i++) {
                const gg = goal.list.sort((a, b) => a.level - b.level)[i];
                const extraImageBase64 = await requestBase64ImageFromWiki(gg.extra_image);
                const extraImage = await base64ToImage(extraImageBase64);
                let x = 70;
                const progresss = this.exp.level_to_xp(gg.level) / this.exp.level_to_xp(goal.list.sort((a, b) => b.level - a.level)[0].level);
                drawImagePixelPerfect(ctx, extraImage, x + ((500 + addbarwidth) * progresss) + extraImage.width / 4, 120, 50, 50);
                ctx.strokeStyle = '#7d73a7';
                ctx.font = '30px "Cinzel Decorative"';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#D1D1D1'; // Light grey
                ctx.fillText(gg.level, x + ((500 + addbarwidth) * progresss) + extraImage.width, 50); //: ${remainingXP}
                ctx.beginPath();
                ctx.lineWidth = 3;
                // Move to the starting point of the line (x, y)
                ctx.moveTo(x + ((500 + addbarwidth) * progresss) + extraImage.width, 55); // Starting point

                // Draw a line to the ending point (x, y)
                ctx.lineTo(x + ((500 + addbarwidth) * progresss) + extraImage.width, 120); // Ending point

                // Stroke the line (make it visible)
                ctx.stroke();

            }
        }

        // Draw progress bar
        drawRoundedRect(ctx, 100 - addbarwidth, 70, (500 + addbarwidth * 2) * progress, 40, 10, '#7d73a7'); // Green for progress bar

        ctx.font = '30px "Cinzel Decorative"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#D1D1D1'; // Light grey
        ctx.fillText(abbreviateNumber(Math.floor(remainingXP)), 350, 98); //: ${remainingXP}
        ctx.textAlign = 'left';
        ctx.fillText(this.exp.xp_to_level(currentXP) - 1, 110 - addbarwidth, 98); //: ${remainingXP}
        ctx.textAlign = 'right';
        if (goal.list) {
            ctx.fillText(goal.list.sort((a, b) => b.level - a.level)[0].level, 590 + addbarwidth, 98);
        } else {
            ctx.fillText(goal.level, 590 + addbarwidth, 98);
        }

        return new AttachmentBuilder(canvas.toBuffer(), { name: 'goal.png' });
    }

    async sendToDiscord(attachments) {
        const channel = await client.channels.cache.find(channel => channel.id === this.goals.channelId);

        if (!channel) {
            console.error(`Channel with ID ${this.settings.channelId} not found`);
            return;
        }

        const messages = await channel.messages.fetch();
        let messageArray = Array.from(messages.values());
        for (let atta in attachments) {
            if (messages.size > atta) {
                await messageArray[atta].edit({ files: [attachments[atta]] });
                delete messageArray[atta];
            } else {
                await channel.send({ files: [attachments[atta]] });
            }

        }
        messageArray.forEach(mess => {
            mess.delete();
        })

    }
}

module.exports = GoalTracker;


function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function drawImagePixelPerfect(ctx, image, x, y, width, height) {
    // Draw the image with high fidelity
    ctx.imageSmoothingEnabled = false;
    const aspectRatio = image.width / image.height;
    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }
    ctx.drawImage(image, x, y, width, height);
}

async function getRandomPedestalImage() {
    const folderPath = path.join('src/assets/pedestals');
    const files = fs.readdirSync(folderPath);

    // Filter files to include only PNG images that match the pattern "ped (x).png"
    const imageFiles = files.filter(file => file.match(/^ped \(\d+\)\.png$/));

    if (imageFiles.length === 0) {
        throw new Error('No pedestal images found in the folder');
    }

    // Pick a random file from the list
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const randomImagePath = path.join(folderPath, imageFiles[randomIndex]);

    return await loadImage(randomImagePath);
}

async function base64ToImage(base64String) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = (error) => {
            reject(error);
        };
        img.src = base64String;
    });
}