const { signedRequest } = require(modules.api);
const fs = require('fs');
const cron = require('node-cron');

async function rofl() {
    let data = JSON.parse(await signedRequest("https://api.github.com/repos/runelite/runelite/contents/runelite-client/src/main/resources/net/runelite/client/plugins/hiscore/bosses"))
    let bosses = [];
    data.forEach(boss => {
        bosses.push(boss.name.replace(".png", "").replaceAll("_"," "))
    });

    fs.writeFileSync("./src/data/lists/bossList.json", JSON.stringify(bosses, null, 2))
    
}
cron.schedule('0 20 * * 3', () => {
    rofl()
});
