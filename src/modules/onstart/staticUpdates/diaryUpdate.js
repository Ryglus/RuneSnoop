const { signedRequest } = require(modules.api); // Adjust the path as necessary
const fs = require('fs');
const cheerio = require('cheerio');
const cron = require('node-cron');

async function rofl() {
    const diaries = {};
    for (const key in JSON.parse(fs.readFileSync("./src/data/tracker/Ryglit.json")).achievement_diaries) {
        try {
            // Fetch the HTML content
            let data = await signedRequest("https://oldschool.runescape.wiki/w/" + key + "_Diary");

            // Load the HTML content into cheerio
            const $ = cheerio.load(data);
            // Select the table using the more specific selector or attributes
            const tables = $('table[data-diary-name="' + key + '"]');
            // Check if the table was found
            if (!tables.length) {
                throw new Error('Table not found');
            }

            tables.each((index, table) => {
                // Get the data-diary-name attribute of the current table
                const tableTier = $(table).attr('data-diary-tier');

                // Extract the rows from the table body
                const rows = $(table).find('tbody tr');

                // Iterate through the rows and extract the data
                rows.each((index, row) => {
                    const cells = $(row).find('td');
                    if ($(cells[0]).text().trim()) {
                        if (!diaries[key]) {
                            diaries[key] = {};
                        }
                        if (!diaries[key][tableTier]) {
                            diaries[key][tableTier] = [];
                        }
                        diaries[key][tableTier].push({
                            task: $(cells[0]).text().trim(),
                            requirements: $(cells[1]).text().trim(),
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching or parsing the data:', error);
        }
    }
    // Write the data to a JSON file outside the loop
    fs.writeFileSync("./src/data/lists/diaryList.json", JSON.stringify(diaries, null, 2));
}
cron.schedule('0 20 * * 3', () => {
    rofl();
});