const fs = require('fs');
const path = require('path');
const { RSExp } = require(modules.Util);

const channelId = "1245350295198892134";

class Roadmap {
    constructor(info) {
        this.lamps = JSON.parse(fs.readFileSync('./src/data/lists/xpLampQuestList.json'));
        //this.compare(info);
    }
    
    async compare(info) {
        let avaiblexp = 0,qlist=[]
        this.lamps.lamps.forEach(lamp => {
            if (info.quests[lamp.quest_name] <= 1) {
                qlist[qlist.length] = lamp.quest_name
                avaiblexp = avaiblexp + Number(lamp.experience_reward)
            }
        });
        
        this.lamps.herblore.forEach(lamp => {
            if (info.quests[lamp.quest_name] <= 1) {
                qlist[qlist.length] = lamp.quest_name
                avaiblexp = avaiblexp + Number(lamp.experience_reward)
            }
        });
        //console.log(avaiblexp)
        let totalxp = Number(info.skills.find(skill => skill.name === 'Herblore').xp+avaiblexp)
        let asd = new RSExp();


        //console.log(totalxp-asd.level_to_xp(70))
        
        //console.log(qlist)
        
    }


    async updateMessage() {
        const channel = await client.channels.cache.find(channel => channel.id === channelId);

        if (!channel) {
            console.error(`Channel with ID ${channelID} not found`);
            return;
        }














        const messages = await channel.messages.fetch();
        if (messages.size > 0) {
            
        } else {

        }
        


        //"# ULTIMATE GOAL: Rust sote!"
    }
}

module.exports = Roadmap;
// Call any methods or perform any actions you need on the `roadmap` instance here