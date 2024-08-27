const { signedRequest } = require(modules.api); // Adjust the path as necessary
const fs = require('fs');
const cheerio = require('cheerio');
const cron = require('node-cron');

async function rofl() {
    try {
        // Fetch the HTML content
        let data = await signedRequest("https://oldschool.runescape.wiki/w/Quests/List");

        // Load the HTML content into cheerio
        
        // Select the table using the more specific selector
        const tables = await extractQuestTable(data);
    
        // Write the data to a JSON file
        fs.writeFileSync("./src/data/lists/questList.json", JSON.stringify(tables, null, 2));
    } catch (error) {
        console.error('Error fetching or parsing the data:', error);
    }
}

function extractQuestTable(data) {
    const $ = cheerio.load(data);
    const questTable = {"Free-to-play": [], "Members": [],"MiniQuests": []};
    const translate = ["Free-to-play", "Members", "MiniQuests"]
    // Select the table with the specific class name
    $('table.wikitable.sortable').each((index, element) => {
        const table = $(element);
        const headers = [];
        // Extract headers
        table.find('thead th').each((i, th) => {
            //console.log($(th).text().trim())
            headers.push($(th).text().trim());
        });

        // Extract rows
        table.find('tbody tr').each((i, tr) => {
            const cells = $(tr).find('td');
            if (cells.length === 0) return;
            let iShift = 0;
            questTable[translate[index]].push({
                id: (() => {
                    const idText = $(cells[0]).text().trim();
                    const idValue = Number(idText);
                    if (!Number(idText)) iShift++;
                    
                    return isNaN(idValue) ? undefined : idValue;
                })(),
                name: $(cells[1-iShift]).text().trim(),
                difficulty: $(cells[2-iShift]).text().trim(),
                length: $(cells[3-iShift]).text().trim(),
                qp: (() => {
                    const idText = $(cells[4-iShift]).text().trim();
                    const idValue = Number(idText);
                    return isNaN(idValue) ? undefined : idValue;
                })(),
            });
        });
    });
    for (let tab in questTable) {
        questTable[tab].sort((a, b) => {
            return a.id - b.id;
        });
    }
    return questTable;
}

cron.schedule('0 20 * * 3', () => {
    rofl();
});