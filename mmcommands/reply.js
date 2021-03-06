module.exports= {
    //Module Properties
    name: "reply",
    description: "Reply to modmail.",
    alias: ["r"],
    usage: "reply <message>",
    permissions: "NONE - Gated by access to Category Channel.",
    async execute(message, args, Discord){
        //Init variables and dependencies
        var main = require("../aegis.js");
        var mmDB = main.sendModmailDB();                        //Modmail table in db
        var client = main.sendClient();                         //The client object
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
        for(var guild in config){
            if(gConfig.modmail && gConfig.modmail.enabled == true){
                var serveGuild = client.guilds.cache.get(guild);
            }
        }                                                       //The guild object for the main guild.
        var content = args.slice(0).join(" ");                  //The message content
        var dateformat = require("dateformat");                 //The dateformat module
        mmDB.findOne({
            where:{
                channelid: message.channel.id
            }
        }).then(row=>{
            //Get target user from DB
            var target = serveGuild.members.cache.get(row.memberid);

            //Reply with a message to the user, with the content of the message being the first argument.
            target.send(`**[${dateformat(new Date(), "HH:MM:ss")}] <${message.author.tag}>** - ${content}`);
            //Delete the "command" message (e.g deletes the ">reply Hello World" message the user sent)
            message.delete();
            //Sends the same, formatted message to the channel to make it cleaner and easier to read.
            message.channel.send(`**[${dateformat(new Date(), "HH:MM:ss")}] <${message.author.tag}>** - ${content}`);
        });
    }
}