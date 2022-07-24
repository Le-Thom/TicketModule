module.exports = { getNewID, updateTicketChannelName }

const TICKET_TYPES = require("./config.json").TICKET_TYPES
const TICKET_STATUSES = require("./config.json").TICKET_STATUSES


function getNewID(client, guild){
    let id = -1
    for(i = 0; i < 10000; i++){
        console.log(client.ticketsData.has(guild.id+".tickets", i))
        if(!client.ticketsData.has(guild.id+".tickets", i)) {
            id = i
            return id
        }
    }
    return id
}

async function updateTicketChannelName(client, channel, ticketData){
    await channel.setName(TICKET_STATUSES.find(s => s.ID == ticketData.status).EMOTE+"-"+ticketData.id.toLocaleString("fr-FR", {
        minimumIntegerDigits: 4,
        useGrouping: false
    })+"-"+TICKET_TYPES.find(t => t.ID == ticketData.type).EMOTE)
}