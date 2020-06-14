module.exports = {
    name: "mute",
    description: "Mutes a user, removing permissions by adding a role.",
    alias: [],
    usage: "mute <userid or mention>",
    permissions: "MANAGE_MESSAGES",
    execute(message, args, client) {
        var guild = message.guild;
        var Discord = require("discord.js");
        var config = require("../config.json");
        var mutes = require("../mutes.json");
        var mainfile = require("../aegis.js");
        var mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === config[guild.id].mutedrole.toLowerCase());
        var logchannel = message.guild.channels.cache.get(config[guild.id].modlogchannelID);
        var moderator = message.author;
        var ms = require("ms");
        var time = args[1];
        var reason = args.slice(2).join(" ");
        var jsonfile = require("jsonfile");
        var util = require("../returndata.js");
        var snowflakeRegexTest = new RegExp("([0-9]{18})");

        var tgtmember;
        if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
            tgtmember = message.guild.members.cache.get(args[0]);
        }else if(message.mentions.users.first()){
            tgtmember = message.mentions.members.first();
        }else{
            return util.userNotFound(message.channel, args[0]);
        }

        if(!message.member.hasPermission("MANAGE_MESSAGES")){
            return util.invalidPermissions(message.channel, "mute", "MANAGE_MESSAGES")
        }else{
            var logchannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.moderator);
            if(!logchannel){
                logchannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.default);
                if(!logchannel){
                    return message.channel.send("You do not have a logchannel configured. Contact your server owner.");
                }
            }
        }
        if(tgtmember.roles.cache.has(mutedRole)){
          tgtmember.roles.remove(mutedRole);
          message.reply("User was unmuted manually!")

          for(var i in mutes){
            var guild = client.guilds.cache.get(mutes[i].guild);
            var member = guild.members.cache.get(i)
            if(!member) return
            if(i == tgtmember.id){
              delete mutes[i];
              jsonfile.writeFileSync("./mutes.json", mutes, {spaces:4}, function(err){
                if(err){
                  console.log(err);
                }else{
                  console.log("Mute removed.");
                }
              })
      
              const embed = new Discord.MessageEmbed()
                .addField("User unmuted", member.displayName)
                .setColor("#00C597")
                .setFooter("AEGIS-MUTE-EXPIRE Event")
                .setTimestamp(new Date());
              return logchannel.send(`Mute expired for **${member.user.tag}**`, {embed});
            }
          }
        }else{
          if(!mutedRole){
            mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === "muted");
            if(!mutedRole){
              return message.channel.send("Please add a muted role to the config. You cannot mute someone without such a role.");
            }
          }
          if(tgtmember.id == config.general.botID){
            return message.channel.send(":(");
          }
          if(!reason){
            reason = "No Reason Supplied.";
          }
          if(!time){
            time = null;
          }
        
          tgtmember.roles.add(mutedRole);
          mutes[tgtmember.id] = {
            "guild" : guild.id,
            "time" : Date.now() + ms(time)
          }
        
          jsonfile.writeFile("./mutes.json", mutes, {spaces: 4}, err =>{
            if(!err){
              message.channel.send("`Aegis Success` - User muted successfully.");
            }else{
              message.channel.send("`Aegis Error` - User could not be muted.");
              console.log(err);
            }
          })
  
          function makeid() {
              var text = "";
              var possible = "ABCDEFGHIJKLMNOPQRSTUVWXY0123456789";
            
              for (var i = 0; i < 5; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            
              return text;
          }
          var currentcaseid = makeid();
  
          const embed = new Discord.MessageEmbed()
              .addField("User ID", tgtmember.id)
              .addField("Added by", moderator.tag)
              .addField("Reason", reason)
              .addField("For", time)
              .setTimestamp(new Date())
              .setFooter("AEGIS-MUTE Command | Case ID: " + currentcaseid)
              .setColor("#00C597");
          logchannel.send(`Mute log for ${tgtmember.tag} - Case ID **${currentcaseid}**`, {embed})
  
          var evidencedb = mainfile.sendEvidenceDB();
  
          if(message.attachments.size > 0){
              message.attachments.forEach(element => {
                  const attatchembed = new Discord.MessageEmbed()
                      .setAuthor(`Evidence For Case ${currentcaseid}`)
                      .setImage(element.url)
                      .setFooter(`AEGIS-WARN-EVIDENCE Event | Case ID: ${currentcaseid}`);
                  logchannel.send(`Mute evidence for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed: attatchembed});
                  
                  evidencedb.create({
                      userid: tgtmember.id,
                      CaseID: currentcaseid,
                      typeOf: "MUTE",
                      dateAdded: message.createdTimestamp,
                      evidenceLinks: element.url
                  });
              });   
          }else{
              evidencedb.create({
                  userid: tgtmember.id,
                  CaseID: currentcaseid,
                  typeOf: "MUTE",
                  dateAdded: message.createdTimestamp,
                  evidenceLinks: "No Evidence",
                  reason: reason
              });
          }
        }
    }
}