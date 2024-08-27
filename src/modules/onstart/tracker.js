const { trackAccount, fetchWikiData } = require(modules.api);
const { hypertextify } = require(modules.Util);
const goals = require(modules.goals);
const quests = require(modules.questTrack);
const roadmap = require(modules.roadmap);
const overvw = require(modules.overView);


const fs = require('fs');
const cron = require('node-cron');


async function track(rsn) {
    let newData = await trackAccount(rsn);
    const previousData = JSON.parse(await fs.readFileSync("./src/data/tracker/" + rsn + ".json"));

    // Compare music tracks
    const compareMusicTracks = (newMusicTracks, prevMusicTracks) => {
        for (const key in newMusicTracks) {
            if (newMusicTracks[key] !== prevMusicTracks[key]) {
                const message = `🎵 **${rsn}** has unlocked the music track '${key}'!`;
                sendToDiscord(message);
                // Send message to Discord or perform other actions
            }
        }
    };

    // Compare quests
    const compareQuests = (newQuests, prevQuests) => {
        for (const key in newQuests) {
            if (newQuests[key] !== prevQuests[key]) {
                let message;
                if (newQuests[key] == 0) message = `❓ **${rsn}** has ? quest [${key}](<https://oldschool.runescape.wiki/w/${hypertextify(key)}>)!`;
                if (newQuests[key] == 1) message = `🛠️ **${rsn}** has started quest [${key}](<https://oldschool.runescape.wiki/w/${hypertextify(key)}>)!`;
                else if (newQuests[key] == 2) message = `🏆 **${rsn}** has finished quest [${key}](<https://oldschool.runescape.wiki/w/${hypertextify(key)}>)!`;
                sendToDiscord(message);
                // Send message to Discord or perform other actions
            }
        }
    };

    // Compare achievement diaries
    const compareAchievementDiaries = (newDiaries, prevDiaries, path = '') => {
        for (const key in newDiaries) {
            const newPath = path ? `${path}.${key}` : key;

            if (typeof newDiaries[key] === 'object' && typeof prevDiaries[key] === 'object') {
                compareAchievementDiaries(newDiaries[key], prevDiaries[key], newPath);
            } else {
                if (newDiaries[key] !== prevDiaries[key]) {
                    let diary = JSON.parse(fs.readFileSync("./src/data/lists/diaryList.json"));
                    let thepath = newPath.split(".");
                    let message="";
                    if (thepath[2] == 'complete') {
                        message= `🏆 **${rsn}** has finished **'${thepath[1]}' '${thepath[0]}'** achievement diary!`;
                    } else {
                        message= `📘 **${rsn}** has completed an achievement a '${thepath[0]}' '${thepath[1]}' diary '${diary[thepath[0]][thepath[1]][thepath[3]].task}'!`;
                    }
                    
                    sendToDiscord(message);
                    // Send message to Discord or perform other actions
                }
            }
        }
    };

    // Compare levels
    const compareLevels = (newLevels, prevLevels) => {
        for (const skill in newLevels) {
            if (newLevels[skill] !== prevLevels[skill]) {
                const message = `📈 **${rsn}** has leveled up '${skill}' to ${newLevels[skill]}!`;
                sendToDiscord(message);
                // Send message to Discord or perform other actions
            }
        }
    };

    // Compare combat achievements
    const compareCombatAchievements = (newAchievements, prevAchievements) => {
        for (const key in newAchievements) {
            if (!prevAchievements.includes(newAchievements[key])) {
                let cas = JSON.parse(fs.readFileSync("./src/data/lists/caTaskList.json"));
                let ca = cas.tasks.find(ca => ca.taskId == newAchievements[key]);
                const message = `📜 **${rsn}** has finished a '${ca.tier}' combat achievement '${ca.name}' for the boss '${ca.monster}'!`;
                sendToDiscord(message);
                // Send message to Discord or perform other actions
            }
        }
    };

    const compareBosses = (newBosses, prevBosses) => {
        for (const boss in newBosses) {
            if (newBosses[boss].score !== prevBosses[boss].score) {
                const message = `⚔️ **${rsn}** has slain '${boss}': ~~${prevBosses[boss].score}~~ -> ${newBosses[boss].score}`;
                sendToDiscord(message);
            }
        }
    };

    // Compare activities
    const compareActivities = (newActivities, prevActivities) => {
        for (const activity in newActivities) {
            if (newActivities[activity].score !== prevActivities[activity].score) {
                const message = `🎯 **${rsn}** has a new activity score for '${activity}': ${newActivities[activity].score}`;
                sendToDiscord(message);
            }
        }
    };

    // Compare collection log
    const compareCollectionLog = (newLog, prevLog) => {
        for (const item of newLog.recent) {
            if (!prevLog.recent.some(prevItem => prevItem.id === item.id && prevItem.obtained === item.obtained)) {
                const message = `📦 **${rsn}** has obtained a new collection log item: **'${item.name}'!**`;
                sendToDiscord(message);
            }
        }
    };


    compareMusicTracks(newData.music_tracks, previousData.music_tracks);
    compareQuests(newData.quests, previousData.quests);
    compareAchievementDiaries(newData.achievement_diaries, previousData.achievement_diaries);
    compareLevels(newData.levels, previousData.levels);
    compareCombatAchievements(newData.combat_achievements, previousData.combat_achievements);
    compareBosses(newData.bosses, previousData.bosses);
    compareActivities(newData.activities, previousData.activities);
    compareCollectionLog(newData.collectionLog, previousData.collectionLog);

    fs.writeFileSync("./src/data/tracker/" + rsn + ".json", JSON.stringify(newData, null, 2));
    return newData;
}

const settings = JSON.parse(fs.readFileSync("./src/data/tracker/toTrack.json"));

async function sendToDiscord(message) {
    var to = await client.channels.cache.find(channel => channel.id === settings.channelId);
    to.send(message);
}
cron.schedule('0,15,30,45 * * * *', async () => {
    const data = await track('Ryglit');
    new goals(data);
    new quests(data);
    new roadmap(data);
    new overvw(data);
});

init();

async function init() {
    const data = JSON.parse(await fs.readFileSync("./src/data/tracker/Ryglit.json"));
    new goals(data);
    new quests(data);
    new roadmap(data);
    new overvw(data);
}
