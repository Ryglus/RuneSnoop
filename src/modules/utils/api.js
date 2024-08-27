const request = require('request');
const fs = require('fs');


async function fetchWikiData(accountName) {
    const url = `https://sync.runescape.wiki/runelite/player/${accountName}/STANDARD`;
    return JSON.parse(await signedRequest(url));
}

async function fetchHiscoreData(accountName) {
    const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${accountName}`;
    return JSON.parse(await signedRequest(url));
}

async function fetchCollectionLogData(accountName) {
  const url = `https://api.collectionlog.net/collectionlog/user/${accountName}`;
  return JSON.parse(await signedRequest(url));
}

async function fetchCollectionLogRecentData(accountName) {
  const url = `https://api.collectionlog.net/items/recent/${accountName}`;
  return JSON.parse(await signedRequest(url));
}

async function signedRequest(url) {
    return new Promise(function (resolve, reject) {
      var headers = {
        'User-Agent': "Ryglu's discord bot - @ryglus",
        'From': 'ryglusjesmurf@seznam.cz'
      }
      request({ headers, uri: url, method: 'GET' }, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      })
    });
  }

// Export the trackAccount function here
async function trackAccount(accountName) {
    try {
        let allData = {};
        const wikiData = await fetchWikiData(accountName);
        const hiscoreData = await fetchHiscoreData(accountName);
        const bosslist = JSON.parse(fs.readFileSync("./src/data/lists/bossList.json"));
        let parsedHiscoreBossData = {};
        let parsedHiscoreActivityData = {};
        hiscoreData.activities.slice(hiscoreData.activities.length-bosslist.length,hiscoreData.activities.length).forEach(activity => {
          parsedHiscoreBossData[activity.name] = {id:activity.id,score:activity.score,rank:activity.rank}
        });
        hiscoreData.activities.slice(0,hiscoreData.activities.length-bosslist.length).forEach(activity => {
          parsedHiscoreActivityData[activity.name] = {id:activity.id,score:activity.score,rank:activity.rank}
        });
        const collectionLogData = await fetchCollectionLogData(accountName);
        const recentCollectionLogData = await fetchCollectionLogRecentData(accountName);
        allData = { ...wikiData};
        allData.collectionLog={}

        allData.skills = hiscoreData.skills
        allData.bosses = parsedHiscoreBossData
        allData.activities = parsedHiscoreActivityData

        allData.collectionLog.recent = recentCollectionLogData.items; 
        allData.collectionLog.logs = collectionLogData.collectionLog.tabs; 
        allData.collectionLog.totalObtained= collectionLogData.collectionLog.totalObtained;
        allData.collectionLog.totalItems= collectionLogData.collectionLog.totalItems;
        allData.collectionLog.uniqueObtained= collectionLogData.collectionLog.uniqueObtained;
        allData.collectionLog.uniqueItems= collectionLogData.collectionLog.uniqueItems;

        return allData;
    } catch (error) {
        console.error('Error tracking account:', error);
    }
}

module.exports = { fetchWikiData, fetchHiscoreData, trackAccount, signedRequest, fetchCollectionLogData, fetchCollectionLogRecentData };
