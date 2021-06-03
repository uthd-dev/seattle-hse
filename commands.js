const memberManager = require("./db/memberManager");
const Discord = require("discord.js");

const compCaptainRoleIds = [process.env.ROLE_ID_COMP_ONE, process.env.ROLE_ID_COMP_TWO];
const compVcIds = [process.env.VC_ID_COMP_ONE, process.env.VC_ID_COMP_TWO];
const scrimCaptainRoleIds = [process.env.ROLE_ID_SCRIM_ONE, process.env.ROLE_ID_SCRIM_TWO];
const scrimVcIds = [process.env.VC_ID_SCRIM_ONE, process.env.ROLE_ID_SCRIM_TWO];

module.exports = client => {
  let server = client.guilds.cache.get("833801666557247528");
  const commandsList = ["playerinfo", "captain"];

  client.on("message", msg => {
    if (!msg.content.startsWith("!") || msg.author.bot) return;
    const args = msg.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!commandsList.includes(command)) return;
    if (!args) return;

    if (command === "playerinfo") getPLayerInfo(msg, args, server);
    if (command === "captain") addTempTeamCaptain(msg, args, server);
  });

  client.on("voiceStateUpdate", (oldState, newState) => {
    if (
      oldState.channel &&
      newState.channel &&
      oldState.channel !== newState.channel
    )
      removeCaptain();
    else if (oldState.channel && !newState.channel) removeCaptain();

    function removeCaptain() {
      console.log(`${oldState.member.displayName} left ${oldState.channelID}`);
      let channelID = oldState.channelID;
      if (compVcIds.includes(channelID)) {
        let index = compVcIds.indexOf(channelID);
        if (oldState.member.roles.cache.has(compCaptainRoleIds[index])) {
          oldState.member.roles.remove(compCaptainRoleIds[index]);
          console.log(
            `${oldState.member.displayName} is no longer a Comp Team Captain.`
          );
        }
      } else if (scrimVcIds.includes(channelID)) {
        let index = scrimVcIds.indexOf(channelID);
        if (oldState.member.roles.cache.has(scrimCaptainRoleIds[index])) {
          oldState.member.roles.remove(scrimCaptainRoleIds[index]);
          console.log(
            `${oldState.member.displayName} is no longer a Scrim Team Captain.`
          );
        }
      }
    }
  });
};

function addTempTeamCaptain(msg, args, server) {
  server.members.fetch(msg.author.id).then(member => {
    if (args.length !== 0) {
      msg.channel.send(
        "Inavlid Usage! Correct Usage: !captain while connected to a Comp/Scrim VC"
      );
      return;
    } //This command does not take arguments

    if (member.voice.channelID) {
      if (compVcIds.includes(member.voice.channelID)) {
        console.log(
          `${
            member.displayName
          } is attempting to become Team Captain of Comp VC. #${
            compVcIds.indexOf(member.voice.channelID) + 1
          }`
        );

        let vcRoleIndex = compVcIds.indexOf(member.voice.channelID);
        msg.guild.roles.fetch(compCaptainRoleIds[vcRoleIndex]).then(role => {
          let members = role.members;
          if (members.length > 0) {
            msg.channel.send("Someone is already Team Captain for this VC!");
          } else {
            member.roles.add(compCaptainRoleIds[vcRoleIndex]).then(() => {
              msg.channel.send(
                `You are now the team captain of ${member.voice.channel} until you disconnect.`
              );
              console.log(`${member.displayName} is now a Comp Team Captain.`);
            });
          }
        });
      } else if (scrimVcIds.includes(member.voice.channelID)) {
        console.log(
          `${
            member.displayName
          } is attempting to become Team Captain of Scrim Team #${
            scrimVcIds.indexOf(member.voice.channelID) + 1
          }`
        );

        let vcRoleIndex = scrimVcIds.indexOf(member.voice.channelID);
        msg.guild.roles.fetch(scrimCaptainRoleIds[vcRoleIndex]).then(role => {
          let members = role.members;
          if (members.length > 0) {
            msg.channel.send("Someone is already Team Captain for this VC!");
          } else {
            member.roles.add(scrimCaptainRoleIds[vcRoleIndex]).then(() => {
              msg.channel.send(
                `You are now the team captain of the Scrim ${member.voice.channel} until you disconnect.`
              );
              console.log(`${member.displayName} is now a Scrim Team Captain.`);
            });
          }
        });
      } else notConnectedErr();
    } else notConnectedErr();

    function notConnectedErr() {
      msg.channel.send(
        `You need to be connected to a Comp or Scrim VC to use this command!`
      );
    }
  });
}

function getPLayerInfo(msg, args, server) {
  let tagged = false;
  let userId = "";

  if (args.length !== 1) {
    msg.channel.send("Inavlid Usage! !playerinfo @username");
    return;
  }
  if (args[0].charAt(0) == "<") {
    userId = args[0].slice(3, -1);
    tagged = true;
  }
  server.members
    .fetch(tagged ? userId : { query: args[0], limit: 1 })
    .then(members => {
      const member = tagged ? members : members.first();
      if (typeof member !== "undefined") {
        memberManager
          .getById(member.id)
          .then(memberInfo => {
            if (memberInfo) {
              let embed = createPlayerInfoEmbed(memberInfo, member);
              msg.channel.send(embed);
            } else {
              msg.channel.send(
                "That person hasn't completed the registration process yet!"
              );
            }
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        msg.channel.send("There is no one by that username in this server!");
      }
    })
    .catch(err => {
      console.log(err);
    });
}

function createPlayerInfoEmbed(memberInfo, member) {
  let ranks = [
    "iron",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "immortal",
    "radiant",
  ];

  let embed = new Discord.MessageEmbed()
    .setColor(member.displayHexColor)
    .setTitle(`@${memberInfo.tag}`)
    .setDescription("Player Information")
    .addFields(
      { name: "Grade: ", value: `${memberInfo.grade}th` },
      { name: "School: ", value: `${memberInfo.school.toUpperCase()}` }
    )
    .setThumbnail(member.user.avatarURL())
    .setTimestamp()
    .setFooter("(Dev'd by aubin@uthd.dev)");

  if (memberInfo.valorant.active) {
    embed.addFields(
      { name: "IGN", value: `${memberInfo.valorant.ign}` },
      {
        name: "Rank",
        value: `${
          ranks[memberInfo.valorant.rank].charAt(0).toUpperCase() +
          ranks[memberInfo.valorant.rank].slice(1)
        }`,
      }
    );
  }

  return embed;
}
