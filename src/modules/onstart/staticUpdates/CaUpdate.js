const { signedRequest } = require(modules.api); // Adjust the path as necessary
const fs = require('fs');
const cheerio = require('cheerio');
const cron = require('node-cron');

async function handleUpdate() {
    let cas = {info: await CaOverViewScrape(),tasks: await CaTaskScrape()}
    
    fs.writeFileSync("./src/data/lists/caTaskList.json", JSON.stringify(cas, null, 2));
}

async function CaOverViewScrape() {
    try {
        // Fetch the HTML content
        let data = await signedRequest("https://oldschool.runescape.wiki/w/Combat_Achievements");

        // Load the HTML content into cheerio
        const $ = cheerio.load(data);
        // Select the table using the more specific selector
        const table = $('table.wikitable')[0]
        const headers = {};
        // Extract headers
        $(table).find('tbody th').each((i, th) => {
            //console.log($(th).text().trim())
            //headers.push($(th).text().trim());
            //console.log($(th).text().trim())
        });

        // Extract rows
        $(table).find('tbody tr').each((i, tr) => {
            const cells = $(tr).find('td');
            if (cells.length === 0 || !Number($(cells[3]).text().trim())) return;
            let name = $(cells[1]).text().trim()
            headers[name] = {
                "# of tasks": $(cells[2]).text().trim(),
                "Points per Task": $(cells[3]).text().trim(),
                "Points in Tier": $(cells[4]).text().trim(),
                "Points required for Rewards": $(cells[5]).text().trim()
            }
        });
        return headers;
        // Write the data to a JSON file
    } catch (error) {
        console.error('Error fetching or parsing the data:', error);
    }
}
async function CaTaskScrape() {

    try {
        // Fetch the HTML content
        let data = await signedRequest("https://oldschool.runescape.wiki/w/Combat_Achievements/All_tasks");

        // Load the HTML content into cheerio
        const $ = cheerio.load(data);
        // Select the table using the more specific selector
        const table = $('table');

        // Check if the table was found
        if (!table.length) {
            throw new Error('Table not found');
        }

        // Extract the rows from the table body
        const rows = table.find('tbody tr');

        // Iterate through the rows and extract the data
        const bosses = [];
        rows.each((index, row) => {
            const cells = $(row).find('td');
            if (cells.length === 0) return;
            bosses.push({
                taskId: $(row).attr('data-ca-task-id'),
                monster: $(cells[0]).text().trim(),
                name: $(cells[1]).text().trim(),
                description: $(cells[2]).text().trim(),
                type: $(cells[3]).text().trim(),
                tier: $(cells[4]).text().trim(),
                compPercentage: $(cells[5]).text().trim()
            });
        });

        // Write the data to a JSON file
        return bosses;
    } catch (error) {
        console.error('Error fetching or parsing the data:', error);
    }
}



cron.schedule('0 20 * * 3', () => {
    handleUpdate()
});