const memberManager = require("./db/memberManager");
const Discord = require("discord.js");
const TeamCaptainManager = require("./util/TeamCaptainManager");
const hardIDs = require("./util/hardIDs");

const compCaptainRoleIds = hardIDs.compCaptainRoleIds;
const compVcIds = hardIDs.compVcIds;
const scrimCaptainRoleIds = hardIDs.scrimCaptainRoleIds;
const scrimVcIds = hardIDs.scrimVcIds;

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
    if (command === "captain") TeamCaptainManager.addTempTeamCaptain(msg, args, server);
  });

  client.on("voiceStateUpdate", (oldState, newState) => {
    if (
      oldState.channel &&
      newState.channel &&
      oldState.channel !== newState.channel
    )
    TeamCaptainManager.removeCaptain(oldState, newState);
    else if (oldState.channel && !newState.channel) TeamCaptainManager.removeCaptain(oldState, newState);

  });
};

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
