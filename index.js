const discord = require('discord.js');
const config = require('./config.json')
const token = config.token;
const bot = new discord.Client();
const db = require('better-sqlite3')
const sql = new db('./data.sqlite');





const prefix = '.';
const fetch = require("node-fetch");



let fs = require('fs');
//commands needed 
//Suggestion
//Reports
//Tickets
//Ban
//Kick
//Mute
//Unmute
//Unban
//Warn
//Checkwarns

bot.on('ready', () => {
    console.log("Bot online");
    bot.user.setActivity("Currently moderating " + bot.guilds.cache.size + " servers.");
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
        sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT,points INTEGER,level INTEGER,warns TEXT);").run();
        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
        sql.pragma("synchronous = 1");
        sql.pragma("journal_mode = wal");

    }
    bot.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
    bot.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level, warns) VALUES (@id, @user, @guild, @points, @level, @warns);");
})
function getscore(userId, guildId) {
    let score = bot.getScore.get(userId, guildId);
    if (!score) {
        let warnsString = JSON.stringify([]);
        score = {
            id: `${guildId}-${userId}`,
            user: userId,
            guild: guildId,
            points: 0,
            level: 1,
            warns: '[]'
        }
        bot.setScore.run(score);
    }
    return bot.getScore.get(userId, guildId);
}
bot.on('message',msg  =>{
let args = msg.content.substring(prefix.length).split(' ');
console.log(args[0])
if(!msg.author.bot){
let score = getscore(msg.author.id, msg.guild.id);
        if (!score) {
            let warnsString = JSON.stringify([]);
            score = {
                id: `${msg.guild.id}-${msg.author.id}`,
                user: msg.author.id,
                guild: msg.guild.id,
                points: 0,
                level: 1,
                warns: "[]"
            }
            bot.setScore.run(score);
        }
        console.log(score)
        score.points = score.points + 1;


        const curLevel = Math.floor(0.5 * Math.sqrt(score.points));
        if (score.level < curLevel) {
            score.level++;
            msg.reply(`You've leveled up to level ${curLevel}!`)
        }
        bot.setScore.run(score);
if(msg.content.startsWith(prefix)){
    switch(args[0]){
        case 'suggestion':
            let sC = msg.guild.channels.cache.find(c => c.name === 'suggestions')
            if (msg.author.id != bot.user.id){
                if(args[1] === undefined){
                    msg.channel.send(msg.author.username +' please specify a suggestion message!');
                }else{
                    const suggestEmbed = new discord.MessageEmbed()
                        .setTitle(msg.author.username+"'s Suggestion:") 
                        .setDescription(msg.content.substring(args[0].length+1,50))
                        .setAuthor(msg.author.tag,msg.author.avatarURL({ dynamic: false, format: 'png', size: 512 }))
                        .setColor("GREEN")
                    
                    sC.send({
                        embed: suggestEmbed
                    }).then(function(message){
                        message.react("👍");
                        message.react("👎")
                    })
                    
                }
            }
        break;
        case 'report':
            let rC = msg.guild.channels.cache.find(c => c.name === 'reports');
            if(msg.author.id != bot.user.id){
 
                if(args[1] === undefined){
                    msg.channel.send(msg.author.username+" please specify a report message!");
                }else{
                    let report = msg.content.substring(args[0].length+1,9999999999);
                    const reportEmbed = new discord.MessageEmbed()
                        .setTitle(msg.author.username+"'s report:")
                        .setDescription(report)
                        .setAuthor(msg.author.tag,msg.author.avatarURL({ dynamic: false, format: 'png', size: 512 }))
                        .setColor('RED')
                       
                    rC.send({
                        embed: reportEmbed
                    })

                }


            }
        break;
        case 'ticket':
            
            if(msg.author.id != bot.user.id){
               let tC = msg.guild.channels.cache.find(c => c.name === 'tickets')
                if(args[1] === undefined){
                    msg.channel.send('Please specify a message!')
                }else{
                let ticket = msg.content.substring(args[0].length+1,100)
                const ticketEmbed = new discord.MessageEmbed()
                    .setTitle(msg.author.username+"'s ticket:")
                    .setAuthor(msg.author.tag,msg.author.avatarURL({ dynamic: false, format: 'png', size: 512 }))
                    .setDescription(ticket)
                    .setColor('GREEN')

                tC.send({
                    embed: ticketEmbed
                }).then(function(message){
                    message.react('✅');
                    bot.on('messageReactionAdd',function(reaction,user) {
                            if(reaction.emoji.name == '✅' && !user.bot){
                                const claimEmbed = new discord.MessageEmbed()
                                    .setTitle('Ticket claimed:')
                                    .setDescription('✅ Ticket claimed by: '+user.tag)
                                    .setAuthor(bot.user.tag,bot.user.avatarURL({ dynamic: false, format: 'png', size: 1024 }))
                                    .setColor('GREEN')
                                    .addField('Issue:',ticket)
                                message.channel.send({
                                    embed: claimEmbed
                                })
                                message.delete()
                                return
                                
                            }
                        
                    })
                })
                }
            }
            
        break;
        case 'ban':
            let exBy = msg.guild.members.cache.find(m => m.id === msg.author.id);
            if (exBy.hasPermission(['BAN_MEMBERS'])){
                let banned = msg.mentions.users.first()
                let reason = msg.content.substring(args[1].length+1,args[1].length+(msg.content.length - args[1].length));
                if (!banned){
                    const specUser = new discord.MessageEmbed()
                        .setAuthor(bot.user.tag,bot.user.avatarURL({ dynamic: true, format: 'png', size: 1024 }))
                        .setColor('RED')
                        .setDescription(':x: Specify a user to ban!')
                    msg.channel.send({
                        embed: specUser
                    })
                }else{
                    banned.send("You've been banned for:"+reason)
                    msg.guild.members.ban(banned)
                }
            }
        break;
        case 'kick':
            let eBy = msg.guild.members.cache.find(m => m.id === msg.author.id);
            if (eBy.hasPermission(['KICK_MEMBERS'])){
                let banned = msg.mentions.users.first()
                let reason = msg.content.substring(args[1].length+1,args[1].length+(msg.content.length - args[1].length));
                if (!banned){
                    const specUser = new discord.MessageEmbed()
                        .setAuthor(bot.user.tag,bot.user.avatarURL({ dynamic: true, format: 'png', size: 1024 }))
                        .setColor('RED')
                        .setDescription(':x: Specify a user to kick!')
                    msg.channel.send({
                        embed: specUser
                    })
                }else{
                    banned.send("You've been kicked for:"+reason)
                    msg.guild.members.kick(banned)
                }
            }
        break;
        case 'mute':
            if(msg.author.id != bot.user.id){
            let executor = msg.guild.members.cache.find(m => m.id === msg.author.id);
            if(executor.hasPermission(['KICK_MEMBERS'])){
                let mutee = msg.guild.members.cache.find(m => m.id === msg.mentions.users.first().id);
                const roles = mutee.roles

                mutee.roles.set([])
                .then(member => console.log(`Member roles is now of ${member.roles.cache.size} size`))
                .catch(console.error);
                
                
                
                msg.channel.send('Muted user')
                setTimeout(function(){
                    msg.channel.send('Unmuting user')
                    mutee.roles.set([roles])
                },5000)

                
                
            }
        }
        break;
        case 'unban':
            if(msg.author.id != bot.user.id){
                let executor = msg.guild.members.cache.find(m => m.id === msg.author.id);
                if(args[1] != undefined){
                let unbId = msg.content.substring(args[1].length+2,50);
                console.log(unbId)
                }
                if(executor.hasPermission(["BAN_MEMBERS"])){
                    console.log('suff perms')
                    if(!args[1]){
                        const spec = new discord.MessageEmbed()
                            .setTitle("Error")
                            .setDescription(":x: Please specify a userID to unban!")
                            .setColor("RED")
                            .setAuthor(bot.user.tag,bot.user.avatarURL({dynamic: false, format: 'png', size: 512}))
                    }
                    msg.guild.fetchBans().then(bans =>{

                    })


                }
            }
        break;
        case 'warn':

            //let towarn = msg.mentions.members.first()
            // let towarnId = msg.mentions.members.first().id
            if (!msg.mentions.members.first()) {
                const specuser = new discord.MessageEmbed()
                    .setTitle("Specify a user to warn!")
                    .setColor("RED")
                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                        dynamic: false,
                        format: 'png',
                        size: 512
                    }))
                    .setTimestamp()
                msg.channel.send({
                    embed: specuser
                })
            } else if (msg.mentions.members.first() != undefined && args[1] != undefined) {
                let warnmsg = msg.content.substring(args[1].length + 8, msg.content.length);
                let score = getscore(msg.mentions.members.first().id, msg.guild.id);
                let warns = JSON.parse(score.warns);
                console.log("warns " + warns[0])
                if (warnmsg == "" || warnmsg == undefined) {
                    warnmsg = "undefined"
                }
                warns.push(warnmsg);
                score.warns = JSON.stringify(warns)
                bot.setScore.run(score);
                const warnedUser = new discord.MessageEmbed()
                    .setTitle(`Warned ${msg.mentions.members.first().displayName} for ${warnmsg}`)
                    .setColor("GREEN")
                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                        dynamic: false,
                        format: 'png',
                        size: 512
                    }))
                    .setTimestamp()
                msg.channel.send({
                    embed: warnedUser
                })

            }
            break;
        case 'level':
                if (msg.mentions.members.first() != undefined) {
                    let score = getscore(msg.mentions.members.first().id, msg.guild.id);
                    const levelEmb = new discord.MessageEmbed()
                        .setTitle(msg.mentions.members.first().displayName + " is level" + score.level)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: levelEmb
                    })

                } else {
                    let score = getscore(msg.author.id, msg.guild.id);
                    const levelEmb = new discord.MessageEmbed()
                        .setTitle(`${msg.author.username} is level ${score.level}`)
                        .setColor("RED")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: levelEmb
                    })

                }
                break;
        case 'warns':
                if (!msg.mentions.members.first()) {
                    let data = getscore(msg.author.id, msg.guild.id);
                    let warnsData = JSON.parse(data.warns);
                    console.log(warnsData)
                    if (warnsData[0] != undefined) {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.author.username}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                        for (i = 0; i < warnsData.length; i++) {
                            warnsEmb.addField(`Warn ${i+1}`, warnsData[i]);
                        }
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    } else {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.author.username}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                            .setDescription(":white_check_mark: This user has no warns!")
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    }
                } else {
                    let data = getscore(msg.mentions.members.first().id, msg.guild.id);
                    let warnsData = JSON.parse(data.warns);
                    console.log(warnsData)
                    if (warnsData.length >= 1) {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.mentions.members.first().displayName}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                        for (i = 0; i < warnsData.length; i++) {
                            warnsEmb.addField(`Warn ${i+1}`, warnsData[i]);
                        }
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    } else {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.mentions.members.first().displayName}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                            .setDescription(":white_check_mark:This user has no warns!")
                        msg.channel.send({
                            warnsEmb
                        })
                    }
                }

                break;
        case 'clearwarns':
                if (!msg.mentions.members.first()) {
                    let score = getscore(msg.author.id, msg.guild.id);
                    let scoreData = JSON.parse(score.warns);

                    scoreData = [];
                    score.warns = JSON.stringify(scoreData);
                    bot.setScore.run(score);
                    const embed = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: Cleared warns for: " + msg.author.username)
                        .setColor("GREEN")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: embed
                    })

                } else {
                    let score = getscore(msg.mentions.members.first().id, msg.guild.id);
                    let scoreData = JSON.parse(score.warns);

                    scoreData = [];
                    score.warns = JSON.stringify(scoreData);
                    bot.setScore.run(score);
                    const embed = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: Cleared warns for: " + msg.mentions.members.first().displayName)
                        .setColor("GREEN")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: embed
                    })
                }
                break;
            fs.readFile('./save-data.json', 'utf8', (err, jsonString ) =>{
                if (err){
                    console.log("File read failed:", err)
                    
                }
                roleData = JSON.parse(jsonString);
                for(i = 0;i < roleData.servers["server_"+guildid].length;i++){
                    if(msg.member.roles.cache.find(r => r.name === roleData.servers["server_"+guildid][i])){
                        console.log('has perms')
                        if(msg.mentions.members.first() != undefined){
                        
                        }else{
                            const specifyuser = new discord.MessageEmbed()
                            .setColor('RED')
                            .setDescription(':x:  Specify a user to check their warns!')
                        msg.channel.send({
                            embed: specifyuser
                        });
                            return;
                        }
                        const toWarn = msg.mentions.members.first().id
                        const toWarnName = msg.mentions.members.first().displayName; 
                        
                        
                        // get warns
                        fs.readFile('./warns.json', 'utf8',(err,warnsString) =>{
                            if(err){
                                console.log(err)
                            }
                            warnsData = JSON.parse(warnsString)
                            const warns = new discord.MessageEmbed()
                            .setColor('GREEN')
                            .setTitle(toWarnName+"'s Warns.")
                            if(warnsData.data[guildid+"_"+toWarn]!= undefined){
                                let count = 0
                            for (i=0;i<warnsData.data[guildid+"_"+toWarn].length;i++){
                                if(warnsData.data[guildid+"_"+toWarn][i] != null){
                                    count+=1
                                    console.log(i);
                                    console.log(warnsData.data[guildid+"_"+toWarn][i]);
                                warns.addField("Warn "+count,warnsData.data[guildid+"_"+toWarn][i],false)
                                }
                            }
                            msg.channel.send({
                                embed: warns
                    
                            }); 
                        }else{
                            const warns = new discord.MessageEmbed()
                            .setColor('GREEN')
                            .setTitle(":white_check_mark: "+ toWarnName+" has no warns!")
                            msg.channel.send({
                                embed: warns
                    
                            }); 
                        }
                        })
                        
                    }
                }
            })    
        break;
       
    }
}
}
})







bot.login(token)