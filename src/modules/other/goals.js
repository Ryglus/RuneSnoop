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
        if (goal.table) ccheit = 120 + goal.table.height * 50;
        const canvas = createCanvas(700, ccheit);
        const ctx = canvas.getContext('2d');

        // Load skill image
        const skillImagePath = path.join('src/assets/skill', `${goal.skill.toLowerCase()}.png`);
        const skillImage = await loadImage(skillImagePath);

        // Create gradient background
        ctx.drawImage(this.createTile(canvas.width, canvas.height), 0, 0);

        // Draw skill image
        drawImagePixelPerfect(ctx, skillImage, 5, 5, 50, 50);

        if (goal.extra_image) {
            const pedestalImage = await getRandomPedestalImage();
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

        const baseBarWidth = 500;
        let addbarwidth = goal.extra_image ? 0 : 70;
        const totalBarWidth = baseBarWidth + addbarwidth * 2;

        // Draw progress bar background
        drawRoundedRect(ctx, 100 - addbarwidth, 70, totalBarWidth, 40, 10, '#414158'); // Dark grey for background bar

        const totalXP = currentXP + remainingXP;
        let maxLevel, progress = currentXP / totalXP;
        
        if(goal.list) {
            maxLevel = goal.list.sort((a, b) => b.level - a.level)[0].level;
            progress = currentXP / this.exp.level_to_xp(maxLevel);
        } 
        // Draw progress bar (based on progress percentage)
        drawRoundedRect(ctx, 100 - addbarwidth, 70, totalBarWidth * progress, 40, 10, '#bc745c'); // Filled progress bar

        if (goal.list) {
            for (let i = 0; i < goal.list.length; i++) {
                const gg = goal.list.sort((a, b) => a.level - b.level)[i];
                const extraImageBase64 = await requestBase64ImageFromWiki(gg.extra_image);
                const extraImage = await base64ToImage(extraImageBase64);
                
                const progresss = this.exp.level_to_xp(gg.level) / this.exp.level_to_xp(maxLevel);
                // Properly scale image with aspect ratio
                const imageWidth = 50;

                // Calculate image position based on progress
                const imageX = 100 - addbarwidth + totalBarWidth * progresss - imageWidth / 2;
                const imageY = 120;

                // Draw scaled image
                drawImagePixelPerfect(ctx, extraImage, imageX, imageY, 50, 50);

                // Draw level text
                ctx.strokeStyle = '#7d73a7';
                ctx.font = '25px "Cinzel Decorative"';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#D1D1D1'; // Light grey
                if (goal.list.length-1 != i) ctx.fillText(currentXP >= this.exp.level_to_xp(gg.level) ? '✓' : gg.level, imageX + imageWidth / 2, currentXP >= this.exp.level_to_xp(gg.level) ? 98 : 63);

                // Draw line from image to progress bar
                ctx.strokeStyle = currentXP >= this.exp.level_to_xp(gg.level) ? '#bc745c':'#212036';
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.moveTo(imageX + imageWidth / 2, 70); // Starting point
                ctx.lineTo(imageX + imageWidth / 2, 110); // Ending point
                if (currentXP <= this.exp.level_to_xp(gg.level)) ctx.stroke();

            }
        }


        // Draw remaining text elements
        ctx.font = '30px "Cinzel Decorative"';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#D1D1D1'; // Light grey
        ctx.fillText(abbreviateNumber(Math.floor(remainingXP)), 350, 98);
        ctx.textAlign = 'left';
        ctx.fillText(this.exp.xp_to_level(currentXP) - 1, 110 - addbarwidth, 98);
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
    createTile(wd, hg) {
        // Create a canvas and get its 2D context
        const canvas = createCanvas(wd, hg);
        const ctx = canvas.getContext('2d');

        // Define a gradient for the background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#281c26');
        gradient.addColorStop(1, '#212036');

        // Draw a rounded rectangle as the background
        drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 20, gradient);

        // Draw a random polygon
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        const x3 = Math.random() * ((canvas.width / 2) - 100) + (canvas.width / 2);
        const x4 = Math.random() * ((canvas.width / 2) - 100) + (canvas.width / 2);

        ctx.beginPath();
        ctx.moveTo(0, 0); // Top-left corner
        ctx.lineTo(x3, 0); // Top-right corner
        ctx.bezierCurveTo(x3, hg * 0.25, x4, hg * 0.25, x4, canvas.height);
        ctx.lineTo(0, canvas.height); // Bottom-left corner
        ctx.closePath();
        ctx.fill();

        if (Math.random() < 0.2) {
            let rec = getRectanglePoints(wd, hg)
            const point1 = {
                x: rec.point1.x,
                y: rec.point1.y
            };

            const point2 = {
                x: rec.point2.x,
                y: rec.point2.y
            };
            // Draw a line connecting the two points
            for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
                ctx.beginPath();
                ctx.moveTo(point1.x - (i * 40), point1.y);
                ctx.lineTo(point2.x - (i * 40), point2.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.lineWidth = 10;
                ctx.stroke();
                ctx.closePath();
            }

        }
        // Return the canvas as an attachment (assuming 'AttachmentBuilder' is your attachment library)
        return canvas;
    }
}

module.exports = GoalTracker;

function getRectanglePoints(width, height) {
    let point1, point2;

    point1 = { x: width / 1.5 + Math.random() * width / 2, y: -10 };
    point2 = { x: point1.x - 200, y: height + 10 };

    return { point1, point2 };
}

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