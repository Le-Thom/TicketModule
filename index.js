const TOKEN = require("./config.json").TOKEN
const discord = require("discord.js")
const { Modal, TextInputComponent, SelectMenuComponent, showModal } = require('discord-modals');
const { getNewID, updateTicketChannelName } = require('./TicketManager')
const discordModals = require('discord-modals')
const enmap = require("enmap")
const TICKET_TYPES = require("./config.json").TICKET_TYPES
const TICKET_STATUSES = require("./config.json").TICKET_STATUSES
const CONFIG = require('./config.json')

//#region TICKET DATA EXAMPLE
/*

    const ticketData = {
        author: modal.member.user.id,
        type: ticketType.ID,
        id: ticketID,
        minecraftUsername: mcUsername,
        content: content,
        creation_date: Date.now(),
        referant_staff_member: 0,
        status: ticketStatus.ID,
        channel: ticketChannel.id
    }

*/
//#endregion

const client = new discord.Client({
    intents: [
        "GUILDS", 
        "GUILD_INTEGRATIONS",
        "GUILD_MEMBERS",
        "GUILD_MESSAGES", 
        "GUILD_MESSAGE_REACTIONS", 
        "GUILD_MESSAGE_TYPING",
    ],
    failIfNotExists: false
})

discordModals(client)

client.login(TOKEN)

client.ticketsData = new enmap({name: "Tickets_Database"})

process.on("exit", () => {
    client.destroy()
})

client.on('ready', async() => {
    console.log("CLIENT READY !")
    client.guilds.cache.forEach(async(guild) => {
        guild.commands.create({
            name: "sendticketcreationmessage",
            description: "Sends the message which will be used by members to create tickets"
        })
        // console.log(client.ticketsData.has(guild.id) || client.ticketsData.has(guild.id, "tickets"))
        await client.ticketsData.ensure(guild.id+".tickets", {})
        // client.ticketsData.ensure(guild.id, [], "tickets")
        const tickets = client.ticketsData.get(guild.id+".tickets")
        console.log(tickets)
        for(i = 0; i < 10000; i++){
            if(client.ticketsData.has(guild.id+".tickets", i)){
                ticketData = client.ticketsData.get(guild.id+".tickets", i)
                if(guild.channels.cache.find(c => c.id == ticketData.channel) == null){
                    client.ticketsData.delete(guild.id+".tickets", ticketData.id)
                }
            }
        }
        // tickets.forEach(t => {
        //     console.log(guild.channels.cache.find(c => c.id == t.channel) == null)
        //     if(guild.channels.cache.find(c => c.id == t.channel) == null){
        //         client.ticketsData.delete(guild.id+".tickets", t.id)
        //     }
        // })
    })
})

client.on('guildCreate', async guild => {
    guild.commands.create({
        name: "sendticketcreationmessage",
        description: "Sends the message which will be used by members to create tickets"
    })
    // console.log(client.ticketsData.has(guild.id) || client.ticketsData.has(guild.id, "tickets"))
    if(!client.ticketsData.has(guild.id) || !client.ticketsData.has(guild.id+".tickets")){
        await client.ticketsData.set(guild.id+".tickets", {})
    }
    // client.ticketsData.ensure(guild.id, [], "tickets")
    const tickets = client.ticketsData.get(guild.id+".tickets")
    console.log(tickets)
    // tickets.forEach(t => {
    //     console.log(guild.channels.cache.find(c => c.id == t.channel) == null)
    //     if(guild.channels.cache.find(c => c.id == t.channel) == null){
    //         client.ticketsData.delete(guild.id+".tickets", t.id)
    //     }
    // })
})

// const modal = new Modal() // We create a Modal
// .setCustomId('modal-customid')
// .setTitle('Modal')
// .addComponents(
//   new TextInputComponent() // We create a Text Input Component
//   .setCustomId('##')
//   .setLabel('Name')
//   .setStyle('SHORT') //IMPORTANT: Text Input Component Style can be 'SHORT' or 'LONG'
//   .setPlaceholder('Write your name here')
//   .setRequired(true)
//   .setMinLength(3)
//   .setMaxLength(16), // If it's required or not

//   new SelectMenuComponent() // We create a Select Menu Component
//   .setCustomId('theme')
//   .setPlaceholder('What theme of Discord do you like?')
//   .addOptions(
//     {
//       label: "Dark",
//       description: "The default theme of Discord.",
//       value: "dark",
//       emoji: "⚫"
//     },
//     {
//       label: "Light",
//       description: "Some people hate it, some people like it.",
//       value: "light",
//       emoji: "⚪"
//     }
//   )
// );


client.on("interactionCreate", async(interaction) => {
    console.log(interaction)
    if(interaction.isCommand()){
        switch(interaction.commandName){
            case "sendticketcreationmessage":
                await interaction.deferReply({
                    ephemeral: true
                })
                interaction.channel.send({
                    embeds: [{
                        description: require('./config.json').TICKET_MESSAGE_CONTENT
                    }],
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            style: "SUCCESS",
                            label: "Créer un nouveau Ticket support",
                            emoji: "🎫",
                            customId: "createTicket"
                        }]
                    }]
                })
                interaction.followUp({
                    ephemeral: true,
                    embeds: [{
                        description: "Sended the 'Create Ticket' message",
                        color: "GREEN"
                    }]
                })
                break
            default:
                //interaction.reply({
                //    ephemeral: true,
                //    embeds: [{
                //        color: "RED",
                //        description: "This command isn't identified in the database"
                //    }]
                //})
                break
        }
    }
    else if(interaction.isButton()){
        switch(interaction.customId){
            case "createTicket":
                const TicketTypes = []
                TICKET_TYPES.forEach(type => {
                    TicketTypes.push({
                        default: false,
                        emoji: type.EMOTE,
                        label: type.NAME,
                        value: type.ID,
                        description: type.DESCRIPTION
                    })
                })
                const modal = new Modal()
                    .setTitle("Nouveau Ticket")
                    .setCustomId("submitTicket")
                    .addComponents(
                        new SelectMenuComponent()
                            .setCustomId("TicketType")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setOptions(TicketTypes)
                            .setPlaceholder("Indique la catégorie de ton ticket"),
                        new TextInputComponent()
                            .setCustomId("MinecraftUsername")
                            .setLabel("Pseudonyme utilisé sur MINECRAFT:")
                            .setMaxLength(16)
                            .setMinLength(3)
                            .setPlaceholder("Notch")
                            .setStyle("SHORT")
                            .setRequired(true),
                        new TextInputComponent()
                            .setCustomId("content")
                            .setLabel("Raison de la création du ticket:")
                            .setMinLength(10)
                            .setMaxLength(1000)
                            .setPlaceholder("Je n'arrive pas à me connecter au serveur de jeu.\nJe voudrais vous proposer un nouveau mode de jeu.")
                            .setStyle("LONG")
                            .setRequired(true)
                    )
                showModal(modal, {
                    client: client,
                    interaction: interaction
                })
                break
            case "TakeTicketInCharge":
                var ticketData = client.ticketsData.get(interaction.guild.id+".tickets", parseInt(interaction.channel.name.split("-", 2)[1]))
                console.log(ticketData)
                if(ticketData == null || !ticketData){
                    return
                }
                var canTakeCharge = false;
                TICKET_TYPES.find(t => t.ID == ticketData.type).ROLES_WHO_CAN_ACCESS_OPENED_TICKET.forEach(i => {
                    if(interaction.member.roles.cache.find(r => r.id == i) != null){
                        canTakeCharge = true
                    }
                })
                if(!canTakeCharge){
                    interaction.reply({
                        ephemeral: true,
                        embeds: [{
                            color: "RED",
                            description: "Vous n'avez pas la permission de prendre en charge ce ticket."
                        }]
                    })
                    return
                }
                
                ticketData.referent_staff_member = interaction.member.user.id
                ticketData.status = "PROCESSING"
                
                await client.ticketsData.set(interaction.guild.id+".tickets", ticketData, ticketData.id)

                updateTicketChannelName(client, interaction.channel, ticketData)

                interaction.message.edit({
                    content: null,
                    embeds: interaction.message.embeds,
                    components: [{
                        type: "ACTION_ROW",
                        components: [
                            interaction.message.components[0].components[0],
                            interaction.message.components[0].components[1].setDisabled(true).setStyle("SECONDARY")
                        ]
                    }]
                })
                interaction.message.reply({
                    embeds: [{
                        color: "GREYPLE",
                        description: "<@"+interaction.member.user.id+"> à pris en charge ce ticket."
                    }]
                })
                // await interaction.channel.setTopic("Ticket pris en charge par <@"+interaction.member.user.id+">")
                interaction.deferUpdate()
                break
            case "closeTicket":
                var ticketData = client.ticketsData.get(interaction.guild.id+".tickets", parseInt(interaction.channel.name.split("-", 2)[1]))
                console.log(ticketData)
                if(ticketData == null || !ticketData){
                    return
                }
                var canCloseTicket = false;
                TICKET_TYPES.find(t => t.ID == ticketData.type).ROLES_WHO_CAN_ACCESS_OPENED_TICKET.forEach(i => {
                    if(interaction.member.roles.cache.find(r => r.id == i) != null){
                        canCloseTicket = true
                    }
                })
                if(ticketData.author == interaction.member.user.id) canCloseTicket = true
                if(!canCloseTicket){
                    interaction.reply({
                        ephemeral: true,
                        embeds: [{
                            color: "RED",
                            description: "Vous n'avez pas la permission de fermer ce ticket."
                        }]
                    })
                    return
                }

                ticketData.status = "CLOSED"

                const permissions = [{
                    id: client.user.id+"",
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY"]
                },{
                    id: interaction.guild.roles.everyone.id+"",
                    deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                }]
    
                TICKET_TYPES.find(t => t.ID == ticketData.type).ROLES_WHO_CAN_ACCESS_CLOSED_TICKET.forEach(i => {
                    permissions.push({
                        id: i,
                        allow: ["VIEW_CHANNEL"]
                    })
                })

                interaction.channel.permissionOverwrites.set(permissions, "closed ticket #"+ticketData.id)
                
                client.ticketsData.set(interaction.guild.id+".tickets", ticketData, ticketData.id)
                
                await interaction.deferUpdate()
                
                updateTicketChannelName(client, interaction.channel, ticketData)

                interaction.channel.send({
                    embeds: [{
                        color: "RED",
                        description: "Ce ticket à été fermé par <@"+interaction.member.user.id+">"
                    }],
                    components: [{
                        type: "ACTION_ROW",
                        components: [{
                            type: "BUTTON",
                            style: "DANGER",
                            customId: "deleteTicket",
                            label: "Supprimer ce ticket",
                            emoji: "🗑",
                        }]
                    }]
                })
                interaction.message.edit({
                    components: [{
                        type: "ACTION_ROW",
                        components: [
                            interaction.message.components[0].components[0].setDisabled(true).setStyle("SECONDARY"),
                            interaction.message.components[0].components[1].setDisabled(true).setStyle("SECONDARY")
                        ]
                    }]
                })

                break
            case "deleteTicket":
                var ticketData = client.ticketsData.get(interaction.guild.id+".tickets", parseInt(interaction.channel.name.split("-", 2)[1]))
                console.log(ticketData)
                if(ticketData == null || !ticketData){
                    return
                }
                
                await interaction.deferUpdate()
                
                await interaction.channel.delete("Deleted ticket #"+ticketData.id+", asked by "+interaction.member.user.tag).catch((err) => {
                    console.log(err)
                }).finally(() => {
                    client.ticketsData.delete(interaction.guild.id+".tickets", ticketData.id)
                })
                
                break
            default:
                // interaction.reply({
                //     ephemeral: true,
                //     embeds: [{
                //         color: "RED",
                //         description: "This interaction isn't recognize... Please, contact the admins"
                //     }]
                // })
                break
        }
    }
    // else if(interaction.isModalSubmit()){
    //     console.log(interaction.customId)
    //     // interaction.components[0].components.find(c => c.customId == "")
    //     switch(interaction.customId){
    //         case "submitTicket":
    //             await interaction.deferReply({
    //                 ephemeral: true
    //             })
    //             /* CREATE TICKET */
    //             // Get category
    //             const category = await interaction.guild.channels.cache.find(c => c.id == CONFIG.TICKETS_CATEGORY_ID)
    //             console.log(interaction.components.find(c => c.components[0].customId == "TicketType"))
    //             if(category == null || !category){
    //                 interaction.editReply({
    //                     ephemeral: true,
    //                     embeds: [{
    //                         color: 'RED',
    //                         description: "Une erreur est survenue lors de la création de votre ticket. Veuillez contacter les administrateurs afin qu'ils règlent ce problème.\n\nPS: On sait que c'est relou de passer du temps à écrire et détailler le contenu d'un ticket... Du coup voici un récapitulatif du tiens pour que tu n'ai plus qu'a le copier/coller ^^",
    //                         fields: [{
    //                             name: "Catégorie du Ticket",
    //                             value: "-" + interaction.components.find(c => c.components[0].customId == "TicketType").components[0].value[0],
    //                             inline: true
    //                         }, {
    //                             name: "Pseudonyme Minecraft",
    //                             value: "-" + interaction.components.find(c => c.components[0].customId == "MinecraftUsername").components[0].value,
    //                             inline: true
    //                         }, {
    //                             name: "Contenu du ticket",
    //                             value: "-" + interaction.components.find(c => c.components[0].customId == "content").components[0].value,
    //                             inline: false
    //                         }],
    //                         footer: {
    //                             text: "Can't find the tickets category channel... Has it been deleted ?"
    //                         }
    //                     }]
    //                 }).catch(e => {
    //                     console.log(e)
    //                 })
    //             }

    //             break
    //         default:
    //             interaction.reply({
    //                 ephemeral: true,
    //                 embeds: [{
    //                     color: "RED",
    //                     description: "This interaction isn't recognize... Please, contact the admins"
    //                 }]
    //             })
    //         break
    //     }
    // }
    // console.log(interaction.isModalSubmit())
    // console.log(interaction.type)
    // console.log(interaction.customId)
})

client.on("modalSubmit", async(modal) => {
    switch(modal.customId){
        case "submitTicket":
            await modal.deferReply({
                ephemeral: true
            })
            /* CREATE TICKET */
            // Get category
            const category = await modal.guild.channels.cache.find(c => c.id == CONFIG.TICKETS_CATEGORY_ID)
            console.log(modal.getSelectMenuValues("TicketType"))
            const ticketType = TICKET_TYPES.find(t => t.ID == modal.getSelectMenuValues("TicketType")[0])
            const ticketStatus = TICKET_STATUSES.find(s => s.ID == "WAITING")
            const mcUsername = modal.getTextInputValue("MinecraftUsername")
            const content = modal.getTextInputValue("content")
            if(category == null || !category){
                modal.editReply({
                    ephemeral: true,
                    embeds: [{
                        color: 'RED',
                        description: "Une erreur est survenue lors de la création de votre ticket. Veuillez contacter les administrateurs afin qu'ils règlent ce problème.\n\nPS: On sait que c'est relou de passer du temps à écrire et détailler le contenu d'un ticket... Du coup voici un récapitulatif du tiens pour que tu n'ai plus qu'a le copier/coller ^^",
                        fields: [{
                            name: "Catégorie du Ticket",
                            value: ticketType.EMOTE + " " + ticketType.NAME,
                            inline: true
                        }, {
                            name: "Pseudonyme Minecraft",
                            value: modal.getTextInputValue("MinecraftUsername"),
                            inline: true
                        }, {
                            name: "Contenu du ticket",
                            value: modal.getTextInputValue("content"),
                            inline: false
                        }],
                        footer: {
                            text: "Can't find the tickets category channel... Has it been deleted ?"
                        }
                    }]
                }).catch(e => {
                    console.log(e)
                })
                return
            }
            const permissions = [{
                id: client.user.id+"",
                allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY"]
            }, {
                id: modal.member.user.id+"",
                allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "EMBED_LINKS"]
            },{
                id: modal.guild.roles.everyone.id+"",
                deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
            }]

            ticketType.ROLES_WHO_CAN_ACCESS_OPENED_TICKET.forEach(i => {
                permissions.push({
                    id: i+"",
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "EMBED_LINKS"]
                })
            })

            const ticketChannel = await modal.guild.channels.create("new-ticket", {
                reason: "New ticket asked by "+modal.member.user.tag,
                type: "GUILD_TEXT",
                parent: category.id,
                permissionOverwrites: permissions
            })

            if(ticketChannel == null || !ticketChannel){
                modal.editReply({
                    ephemeral: true,
                    embeds: [{
                        color: 'RED',
                        description: "Une erreur est survenue lors de la création de votre ticket. Veuillez contacter les administrateurs afin qu'ils règlent ce problème.\n\nPS: On sait que c'est relou de passer du temps à écrire et détailler le contenu d'un ticket... Du coup voici un récapitulatif du tiens pour que tu n'ai plus qu'a le copier/coller ^^",
                        fields: [{
                            name: "Catégorie du Ticket",
                            value: ticketType.EMOTE + " " + ticketType.NAME,
                            inline: true
                        }, {
                            name: "Pseudonyme Minecraft",
                            value: modal.getTextInputValue("MinecraftUsername"),
                            inline: true
                        }, {
                            name: "Contenu du ticket",
                            value: modal.getTextInputValue("content"),
                            inline: false
                        }],
                        footer: {
                            text: "Can't create the ticket channel... Do i have to permissions to create it ?"
                        }
                    }]
                }).catch(e => {
                    console.log(e)
                })
                return
            }

            const ticketID = await getNewID(client, modal.guild)
            
            if(ticketID < 0){
                modal.editReply({
                    ephemeral: true,
                    embeds: [{
                        color: 'RED',
                        description: "Une erreur est survenue lors de la création de votre ticket. Veuillez contacter les administrateurs afin qu'ils règlent ce problème.\n\nPS: On sait que c'est relou de passer du temps à écrire et détailler le contenu d'un ticket... Du coup voici un récapitulatif du tiens pour que tu n'ai plus qu'a le copier/coller ^^",
                        fields: [{
                            name: "Catégorie du Ticket",
                            value: ticketType.EMOTE + " " + ticketType.NAME,
                            inline: true
                        }, {
                            name: "Pseudonyme Minecraft",
                            value: modal.getTextInputValue("MinecraftUsername"),
                            inline: true
                        }, {
                            name: "Contenu du ticket",
                            value: modal.getTextInputValue("content"),
                            inline: false
                        }],
                        footer: {
                            text: "Can't find the tickets category channel... Has it been deleted ?"
                        }
                    }]
                }).catch(e => {
                    console.log(e)
                })
                return
            }

            const ticketData = {
                author: modal.member.user.id+"",
                type: ticketType.ID,
                id: ticketID,
                minecraftUsername: mcUsername,
                content: content,
                creation_date: Date.now(),
                referant_staff_member: 0,
                status: ticketStatus.ID,
                channel: ticketChannel.id
            }

            await client.ticketsData.set(modal.guild.id+".tickets", ticketData, ticketData.id)

            await updateTicketChannelName(client, ticketChannel, ticketData)
            
            let List = []
            if(ticketType.ROLES_TO_MENTION.length > 0){
                ticketType.ROLES_TO_MENTION.forEach(id => {
                    List.push("<@&"+modal.guild.roles.cache.find(r => r.id == id)+">")
                })
            }

            ticketChannel.send({
                content: List.length > 0 ? List.join(", ") : null,
                embeds: [{
                    color: "BLURPLE",
                    description: "Bonjour <@"+modal.member.user.id+">, les membres du staff en relation avec le type de votre ticket ont étés avertis et ne devraient plus tarder à vous répondre.\nEn attendant, vous pouvez détailler votre demande/problème et envoyer des fichiers (images, vidéos, logs, etc...) pour donner un maximum d'informations aux responsables de votre ticket.",
                    fields: [{
                        name: "Type de ticket",
                        value: "> "+ticketType.EMOTE+ " " +ticketType.NAME,
                        inline: true
                    }, {
                        name: "Pseudonyme Minecraft",
                        value: "> `"+mcUsername+"`",
                        inline: true
                    },{
                        name: "Description du Ticket",
                        value: content,
                        inline: false
                    }]
                }],
                components: [{
                    type: "ACTION_ROW",
                    components: [{
                        type: "BUTTON",
                        customId: "closeTicket",
                        style: "DANGER",
                        label: "Fermer le ticket",
                        emoji: "📋"
                    }, {
                        type: "BUTTON",
                        customId: "TakeTicketInCharge",
                        style: "PRIMARY",
                        label: "Prendre le ticket en charge",
                        emoji: "📑"
                    }]
                }]
            })

            modal.editReply({
                ephemeral: true,
                embeds: [{
                    color: 'GREEN',
                    description: "Votre ticket <#"+ticketData.channel+"> à été créé avec succès."
                }]
            })

            break
        default:
            break
    }
    modal.get
    console.log(modal)
})