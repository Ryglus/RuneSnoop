
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { RSExp, requestBase64ImageFromWiki, abbreviateNumber } = require(modules.Util);
const { createCanvas, loadImage, Image } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const keys = ["attack", "hitpoints", "mining", "strength", "agility", "smithing", "defence", "herblore", "fishing", "ranged", "thieving", "cooking", "prayer", "crafting", "firemaking", "magic", "fletching", "woodcutting", "runecraft", "slayer", "farming", "construction", "hunter", "overall"];
const diaryKeys = ["Easy", "Medium", "Hard", "Elite"];



class overView {
    constructor(data) {
        this.channelId = "1259514845586260035";
        this.displayInformation(data)
    }

    async displayInformation(data) {
        //console.log(data.achievement_diaries)
        let goalDis = [
            await this.miscDisplay(data),
            await this.caDisplay(data.combat_achievements),
            await this.diaryDisplay(data.achievement_diaries),
            await this.bossDisplay(data.bosses),
            await this.skillDisplay(data.skills.sort((a, b) => keys.indexOf(a.name.toLowerCase()) - keys.indexOf(b.name.toLowerCase())))
        ];
        this.sendToDiscord(goalDis);
    }
    async caDisplay(data) {
        let caList = JSON.parse(fs.readFileSync('src/data/lists/caTaskList.json'));

        let tierCount = [];
        Object.keys(caList.info).forEach((tier, index) => {
            tierCount[index] = 0
        });

        const padding = 0;
        const tileWidth = 170;
        const tileHeight = 180;

        const tilesPerRow = tierCount.length;




        const canvas = createCanvas(tileWidth * tilesPerRow + padding * (tilesPerRow - 1), Math.ceil(tierCount.length / tilesPerRow) * (tileHeight + padding) - padding + 1);

        const ctx = canvas.getContext('2d');

        ctx.drawImage(this.createTile(tileWidth * tilesPerRow + padding * (tilesPerRow - 1), Math.ceil(tierCount.length / tilesPerRow) * (tileHeight + padding) - padding + 1), 0, 0);


        const regex = /\d+/;
        let pointCount = 0;
        for (let tier of data) {
            const tierNumber = caList.tasks.find(obj => obj.taskId == tier).tier.match(regex)[0];
            tierCount[tierNumber - 1]++;
            pointCount += parseInt(tierNumber);
        }
        for (let tier in caList.info) {
            //
            let index = Object.keys(caList.info).indexOf(tier);
            const row = Math.floor(index / tilesPerRow);
            const col = index % tilesPerRow;
            const x = col * (tileWidth + padding);
            const y = row * (tileHeight + padding);

            ctx.fillStyle = '#D1D1D1'; // Light grey
            ctx.font = '40px "Cinzel Decorative"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${tierCount[index]}/${caList.info[tier]["# of tasks"]}`, x + tileWidth / 2, y + 110);

            if (caList.info[tier].hasOwnProperty("img")) {
                const image = new Image();
                image.onload = () => {
                    drawImagePixelPerfect(ctx, image, x - image.width * 1.5 + tileWidth / 2, y + 15, 70, 70);
                }
                image.src = caList.info[tier].img;
            } else {
                await requestBase64ImageFromWiki(`Combat_Achievements_-_${tier.toLocaleLowerCase()}_tier_icon`).then((base64) => {
                    caList.info[tier].img = base64;
                    fs.writeFileSync('src/data/lists/caTaskList.json', JSON.stringify(caList, null, 2));
                    const image = new Image();
                    image.onload = () => {
                        drawImagePixelPerfect(ctx, image, x + 15, y + 15, 70, 70);
                    }
                    image.src = base64;
                });
            }
            if (index != 5) {
                ctx.beginPath();
                ctx.moveTo(x + tileWidth, y + 10);
                ctx.lineTo(x + tileWidth, y + 140 - 10);
                ctx.strokeStyle = '#D1D1D1';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();

            }

        }

        drawRoundedRect(ctx, 15, tileHeight - 40, canvas.width - 30, 30, 9, '#414158')

        const sortedEntries = Object.entries(caList.info).sort(([, a], [, b]) => b["Points required for Rewards"] - a["Points required for Rewards"]);
        const foundEntry = sortedEntries.find(([, obj]) => obj["Points required for Rewards"] <= pointCount);

        if (foundEntry) {
            const [title, details] = foundEntry;
            const [nexttitle, nextdetails] = Object.entries(caList.info).find(([key, obj]) => obj["Points required for Rewards"] > pointCount);


            const segmentsDone = Object.keys(caList.info).indexOf(title) + 1;

            drawRoundedRect(ctx, 15, tileHeight - 40, (segmentsDone * tileWidth) + (tileWidth * (pointCount / nextdetails["Points required for Rewards"])) - 15, 30, 9, '#bc745c')
            ctx.fillStyle = '#D1D1D1'; // White color
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(`${pointCount} (${nextdetails["Points required for Rewards"] - pointCount})`, (segmentsDone * tileWidth) + tileWidth / 2, tileHeight - 26);
        } else {
            console.log('No matching entry found');
        }

        for (let i = 1; i < tierCount.length; i++) {
            ctx.beginPath();
            ctx.moveTo(i * tileWidth, tileHeight - 40);
            ctx.lineTo(i * tileWidth, tileHeight - 10);
            ctx.strokeStyle = '#212036';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

        }


        return new AttachmentBuilder(canvas.toBuffer(), { name: 'goal.png' });
    }


    async miscDisplay(data) {
        const tileWidth = 1000;
        const tileHeight = 150;
        const tilesPerRow = 1;
        const padding = 10;

        let miscimages = JSON.parse(fs.readFileSync('src/assets/misc_base64.json'));
        let miscKeys = [["quests", "musicTracks"], ["collectionLog"], ["activities"]]

        const canvas = createCanvas(tileWidth * tilesPerRow + padding * (tilesPerRow - 1), Math.ceil(miscKeys.length / tilesPerRow) * (tileHeight + padding) - padding + 1);
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < miscKeys.length; i++) {
            const tileY = i * (tileHeight + padding);

            ctx.drawImage(this.createTile(tileWidth, tileHeight), 0, tileY);

            for (let misc of miscKeys[i]) {
                let index = miscKeys[i].indexOf(misc);

                const col = index % miscKeys[i].length;
                const x = col * (tileWidth / miscKeys[i].length);
                const sectionWidth = ((tileWidth - (miscKeys[i].length / miscKeys[i].length)) / miscKeys[i].length)
                const y = tileY; // Use the calculated tileY

                ctx.fillStyle = '#D1D1D1'; // Light grey
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (misc === "quests") {

                    let questlist = JSON.parse(fs.readFileSync('src/data/lists/questList.json'));
                    const memberQuests = questlist.Members.filter(obj => Number.isInteger(obj.id));
                    const freeToPlayQuests = questlist["Free-to-play"].filter(obj => Number.isInteger(obj.id));
                    const memberQuestNames = memberQuests.map(obj => obj.name);
                    const freeToPlayQuestNames = freeToPlayQuests.map(obj => obj.name);

                    const completeCountMem = Object.entries(data.quests)
                        .filter(([key, value]) => memberQuestNames.includes(key) && value === 2)
                        .length;
                    const completeCountFre = Object.entries(data.quests)
                        .filter(([key, value]) => freeToPlayQuestNames.includes(key) && value === 2)
                        .length;
                    const completeCount = completeCountMem + completeCountFre;
                    const totalCountMem = memberQuestNames.length;
                    const totalCountFre = freeToPlayQuestNames.length;
                    const totalCount = totalCountMem + totalCountFre;
                    const totalQPs = Object.entries(data.quests)
                        .filter(([key, value]) => (memberQuestNames.includes(key) || freeToPlayQuestNames.includes(key)) && value === 2)
                        .reduce((sum, [key, value]) => {
                            const quest = memberQuests.find(q => q.name === key) || freeToPlayQuests.find(q => q.name === key);
                            return sum + (quest ? quest.qp : 0);
                        }, 0);

                    ctx.font = '20px "Cinzel Decorative"';
                    ctx.fillText(`Cq: ${completeCount}/${totalCount}`, x + sectionWidth / 2, y + 38);
                    ctx.fillText(`Total QPs: ${totalQPs}`, x + sectionWidth / 2, y + 78); // Adjust y-position as needed

                    if (!miscimages.hasOwnProperty(misc)) {
                        await requestBase64ImageFromWiki(misc.toLocaleLowerCase()).then((base64) => {
                            miscimages[misc] = base64;
                            fs.writeFileSync('src/assets/misc_base64.json', JSON.stringify(miscimages, null, 2));
                            const image = new Image();
                            image.onload = () => {
                                drawImagePixelPerfect(ctx, image, x + 15, y + 15, 70, 70);
                            }
                            image.src = base64;
                        });
                    }
                    const image = new Image();
                    image.onload = () => {
                        drawImagePixelPerfect(ctx, image, x + 15, y + 15, 70, 70);
                    }
                    image.src = miscimages[misc];

                    if (index != miscKeys[i].length - 1) {
                        ctx.beginPath();
                        ctx.moveTo(x + sectionWidth, y + 10);
                        ctx.lineTo(x + sectionWidth, y + tileHeight - 10);
                        ctx.strokeStyle = '#D1D1D1';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
                if (misc === "musicTracks") {
                    const musicTotal = Object.values(data.music_tracks).length;
                    const musicTotalComplete = Object.values(data.music_tracks).filter(track => track === true).length;
                    ctx.font = '20px "Cinzel Decorative"';
                    ctx.fillText(`Songs unlocked: ${musicTotalComplete - 6}/${musicTotal}`, x + sectionWidth / 2, y + 38);

                    if (index != miscKeys[i].length - 1) {
                        ctx.beginPath();
                        ctx.moveTo(x + sectionWidth, y + 10);
                        ctx.lineTo(x + sectionWidth, y + tileHeight - 10);
                        ctx.strokeStyle = '#D1D1D1';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.closePath();
                    }
                }
                if (misc === "collectionLog") {
                    ctx.font = '40px "Cinzel Decorative"';
                    ctx.fillText(`Collections logged: ${data.collectionLog.uniqueObtained}/${data.collectionLog.uniqueItems}`, x + (tileWidth / 2), y + 38);
                    data.collectionLog.recent.forEach(async (item, index) => {
                        if (!miscimages.hasOwnProperty(item.name)) {
                            await requestBase64ImageFromWiki(item.name.toLocaleLowerCase()).then((base64) => {
                                miscimages[item.name] = base64;
                                fs.writeFileSync('src/assets/misc_base64.json', JSON.stringify(miscimages, null, 2));
                            });
                        }
                        const image = new Image();
                        image.onload = () => {
                            drawImagePixelPerfect(ctx, image, x + 15 + (index * 100), y + 65, 70, 70);
                        }
                        image.src = miscimages[item.name];
                    });
                }
                if (misc === "activitie") {
                    let imageKeys = [""]
                    ctx.font = '40px "Cinzel Decorative"';
                    ctx.fillText(`Activities`, x + (tileWidth / 2), y + 38);
                    const filteredData = {};

                    Object.keys(data.activities).forEach(key => {
                        if (data.activities[key].score > 0) {
                            filteredData[key] = data.activities[key];
                        }
                    });

                    for (let item of Object.keys(filteredData)) {
                        let i = Object.keys(filteredData).indexOf(item);

                        if (!miscimages.hasOwnProperty(item)) {
                            await requestBase64ImageFromWiki(item).then((base64) => {
                                miscimages[item] = base64;
                                fs.writeFileSync('src/assets/misc_base64.json', JSON.stringify(miscimages, null, 2));
                            });
                        }

                        const image = new Image();
                        image.onload = () => {
                            drawImagePixelPerfect(ctx, image, x + 15 + (50 * i), y + 65, 70, 70);
                        }
                        image.src = miscimages[item];
                    }
                }
            }
        }

        return new AttachmentBuilder(canvas.toBuffer(), { name: 'goal.png' });
    }


    async diaryDisplay(data) {
        const tileWidth = 500;
        const tileHeight = 150;

        const padding = 10;

        const tilesPerRow = 3;
        const canvas = createCanvas(tileWidth * tilesPerRow + padding * (tilesPerRow - 1), Math.ceil(Object.keys(data).length / tilesPerRow) * (tileHeight + padding) - padding + 1);
        const ctx = canvas.getContext('2d');

        for (let index in Object.keys(data)) {
            let diaryName = Object.keys(data)[index];
            let diaryData = data[diaryName];
            const row = Math.floor(index / tilesPerRow);
            const col = index % tilesPerRow;
            const x = col * (tileWidth + padding);
            const y = row * (tileHeight + padding);

            ctx.drawImage(this.createTile(tileWidth, tileHeight), x, y);

            ctx.fillStyle = '#D1D1D1'; // Light grey
            ctx.font = '40px "Cinzel Decorative"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${diaryName}`, x + (tileWidth / 2), y + 38);


            for (let i = 0; i < diaryKeys.length; i++) {
                const difficulty = diaryKeys[i];
                const dd = diaryData[difficulty];

                // Calculate the position for each segment
                const segmentWidth = 100;
                const segmentHeight = 50;
                const segmentX = x + 50 + (i * segmentWidth); // Adjusted spacing for each segment
                const segmentY = y + 80;

                const isFirstSegment = (i === 0);
                const isLastSegment = (i == 3);

                // Draw x/x completed text inside the segment
                const completedCount = dd.tasks.filter(task => task).length; // Count completed tasks
                const totalCount = dd.tasks.length; // Total number of tasks
                const text = `${completedCount}/${totalCount}`;

                // Draw segment background with rounded corners as needed
                let colr = dd.complete ? '#bc745c' : '#414158';
                ctx.fillStyle = colr;
                ctx.beginPath();
                if (isFirstSegment) {
                    drawDefinedRoundedRect(ctx, segmentX, segmentY, segmentWidth, segmentHeight, 15, 0, colr);
                    if (!dd.complete && completedCount > 0) {
                        drawDefinedRoundedRect(ctx, segmentX, segmentY, segmentWidth * (completedCount / totalCount), segmentHeight, 15, 0, '#bc745c');
                    }
                } else if (isLastSegment) {
                    drawDefinedRoundedRect(ctx, segmentX, segmentY, segmentWidth, segmentHeight, 0, 15, colr);
                    if (!dd.complete && completedCount > 0) {
                        drawDefinedRoundedRect(ctx, segmentX, segmentY, segmentWidth * (completedCount / totalCount), segmentHeight, 0, 15, '#bc745c');
                    }
                } else {
                    ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);

                    if (!dd.complete && completedCount > 0) {
                        ctx.fillStyle = '#bc745c';
                        ctx.fillRect(segmentX, segmentY, segmentWidth * (completedCount / totalCount), segmentHeight);
                    }
                }
                ctx.closePath();

                const separatorX = segmentX + segmentWidth;
                ctx.beginPath();
                ctx.moveTo(separatorX, segmentY);
                ctx.lineTo(separatorX, segmentY + segmentHeight);
                ctx.strokeStyle = '#212036';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();

                ctx.fillStyle = '#D1D1D1'; // White color
                ctx.font = '19px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (!dd.complete) ctx.fillText(text, segmentX + segmentWidth / 2, segmentY + segmentHeight / 2);
                else ctx.fillText('✓', segmentX + segmentWidth / 2, segmentY + segmentHeight / 2);
                // Optionally draw rounded ends for the first and last segments

            }
        }

        return new AttachmentBuilder(canvas.toBuffer(), { name: 'goal.png' });
    }



    async bossDisplay(data) {
        const tileWidth = 500;
        const tileHeight = 125;

        const padding = 10;

        const filteredData = {};

        Object.keys(data).forEach(key => {
            if (data[key].score > 0) {
                filteredData[key] = data[key];
            }
        });

        let bossimages = JSON.parse(fs.readFileSync('src/assets/bosses_base64.json'));

        const tilesPerRow = 4;
        const canvas = createCanvas(tileWidth * tilesPerRow + padding * (tilesPerRow - 1), Math.ceil(Object.keys(filteredData).length / tilesPerRow) * (tileHeight + padding));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#D1D1D1'; // Light grey
        ctx.font = '38px "Cinzel Decorative"';
        ctx.textAlign = 'left';

        for (let index in Object.keys(filteredData)) {
            let bossname = Object.keys(filteredData)[index];
            let bossinfo = filteredData[bossname];
            const row = Math.floor(index / tilesPerRow);
            const col = index % tilesPerRow;
            const x = col * (tileWidth + padding);
            const y = row * (tileHeight + padding);
            ctx.drawImage(this.createTile(tileWidth, tileHeight), x, y);

            if (bossimages.hasOwnProperty(bossname)) {
                const image = new Image();
                image.onload = () => {
                    drawImagePixelPerfect(ctx, image, x + 10, y + 15, 70, tileHeight - 30);
                }
                image.src = bossimages[bossname];
            } else {
                await requestBase64ImageFromWiki(bossname.toLocaleLowerCase()).then((base64) => {
                    bossimages[bossname] = base64;
                    fs.writeFileSync('src/assets/bosses_base64.json', JSON.stringify(bossimages, null, 2));
                    const image = new Image();
                    image.onload = () => {
                        drawImagePixelPerfect(ctx, image, x + 10, y + 15, 70, tileHeight - 30);
                    }
                    image.src = base64;
                });
            }

            ctx.fillStyle = '#D1D1D1'; // Light grey
            ctx.font = '38px "Cinzel Decorative"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const words = bossname.split(' ');
            let line = '';
            let yPosition = y + 44;
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const textWidth = ctx.measureText(line + word).width;
                if (textWidth > tileWidth - 10 - 100) {
                    ctx.fillText(line, x + 75, yPosition);
                    line = word + ' ';
                    yPosition += 40;
                } else {
                    line += word + ' ';
                }
            }
            ctx.fillText(line, x + 75, yPosition);

            ctx.textAlign = 'right';
            ctx.font = '49px "Cinzel Decorative"';

            ctx.fillText(`${bossinfo.score}`, x + tileWidth - 15, y + tileHeight / 2);


        }


        return new AttachmentBuilder(canvas.toBuffer(), { name: 'goal.png' });
    }



    async skillDisplay(data) {
        const tileWidth = 450;
        const tileHeight = 100;
        const tilesPerRow = 3;
        const padding = 10;
        const canvas = createCanvas(tileWidth * tilesPerRow + padding * (tilesPerRow - 1), Math.ceil(data.length / tilesPerRow) * (tileHeight + padding));
        const ctx = canvas.getContext('2d');
        for (let index in data) {
            let skill = data[index];
            const row = Math.floor(index / tilesPerRow);
            const col = index % tilesPerRow;
            const x = col * (tileWidth + padding);
            const y = row * (tileHeight + padding);
            ctx.drawImage(this.createTile(tileWidth, tileHeight), x, y);

            if (skill.name != "Overall") {
                let xp = new RSExp();
                let ratio = (skill.xp - xp.level_to_xp(parseInt(skill.level))) / (xp.level_to_xp(parseInt(skill.level) + 1) - xp.level_to_xp(parseInt(skill.level)))
                drawRoundedRect(ctx, x + 10, y + tileHeight - 15, tileWidth - 20, 10, 5, '#414158')
                if (ratio >= 0.09) drawRoundedRect(ctx, x + 10, y + tileHeight - 15, (tileWidth - 20) * ratio, 10, 5, '#bc745c')
            }

            ctx.fillStyle = '#D1D1D1'; // Light grey
            ctx.font = '35px "Cinzel Decorative"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${skill.name}`, x + 90, y + (tileHeight / 2) - 35 / 2);
            ctx.textAlign = 'right';
            ctx.font = '50px "Cinzel Decorative"';
            ctx.fillText(`${skill.level}`, x + tileWidth - 10, y + 50);


            const skillImagePath = path.join('src/assets/skill', `${data[index].name.toLowerCase()}.png`);
            if (fs.existsSync(skillImagePath)) {
                const skillImage = await loadImage(skillImagePath);
                drawImagePixelPerfect(ctx, skillImage, x + 15, y + 15, 70, 70);
            }
        }
        return new AttachmentBuilder(canvas.toBuffer(), { name: 'goal.png' });
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
                ctx.moveTo(point1.x-(i*40), point1.y);
                ctx.lineTo(point2.x-(i*40), point2.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                ctx.lineWidth = 10;
                ctx.stroke();
                ctx.closePath();
            }

        }
        // Return the canvas as an attachment (assuming 'AttachmentBuilder' is your attachment library)
        return canvas;
    }
    async sendToDiscord(attachments) {
        const channel = await client.channels.cache.find(channel => channel.id === this.channelId);

        if (!channel) {
            console.error(`Channel with ID ${this.channelId} not found`);
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
function drawDefinedRoundedRect(ctx, x, y, width, height, radiusLeft, radiusRight, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + radiusLeft, y);
    ctx.lineTo(x + width - radiusRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radiusRight);
    ctx.lineTo(x + width, y + height - radiusRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radiusRight, y + height);
    ctx.lineTo(x + radiusLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radiusLeft);
    ctx.lineTo(x, y + radiusLeft);
    ctx.quadraticCurveTo(x, y, x + radiusLeft, y);
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


module.exports = overView;