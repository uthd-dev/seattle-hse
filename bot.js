require("dotenv").config();
const Discord = require('discord.js');
const { Client, Intents } = Discord;
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES] });

const Members = require("./db/memberSchema");
const memberManager = require("./db/memberManager");

class Member {
  constructor(id, tag, school, fullname, grade, valInfo) {
    this.discordId = id;
    this.tag = tag;
    this.school = school;
    this.fullname = fullname;
    this.grade = grade;
    this.valorant = valInfo;
  }
}

const valRankRoleIds = [
  "833883036327608371",
  "833883295938904075",
  "833883191558406144",
  "833883460610686987",
  "833883658304749589",
  "833883848525873192",
  "833884072526872606",
  "833884174712569888",
];
const valRoleId = "833802488774787112";
const registeredRoleId = "835944759390371921";
const schoolRoleIds = {
  ghs: "833827821868023838",
  chs: "833827994044596314",
  rhs: "833828044396953682",
  ihs: "833828084566196275",
};

client.once("ready", () => {
  let regChannel = client.channels.cache.get("835945554709315614");

  require("./commands")(client);

  deleteChannelMessages(regChannel).then(() => {
    createRegisterEmbed(regChannel);
  });

  console.log("Ready!");
});

//Deletes last 100 messages in #register channel to make sure that the bot uses a new embed for registration on startup.
function deleteChannelMessages(channel) {
  return new Promise((resolve, reject) => {
    channel.messages
      .fetch({ limit: 100 })
      .then(messages => {
        channel.bulkDelete(messages).then(() => {
          resolve();
        });
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
}

//Creates a new embed in the #register channel
function createRegisterEmbed(regChannel) {
  let regEmbed = new Discord.MessageEmbed()
    .setColor("#F0524C")
    .setTitle("Register for Seattle HSE!")
    .setDescription("React below to get access to the rest of the server")
    .setTimestamp()
    .setFooter("(Check your DMs)");

  regChannel
    .send(regEmbed)
    .then(message => {
      message.react("😎");
      return message;
    })
    .then(message => {
      //Filter for reactions of 😎 that aren't from the bot
      const filter = (reaction, user) => {
        return (
          reaction.emoji.name === "😎" &&
          user.id !== message.author.id &&
          message.author.bot
        );
      };

      const collector = message.createReactionCollector(filter);

      collector.on("collect", (reaction, user) => {
        console.log(`${user.tag} reacted to the Registration Embed!`);
        removeUserReaction(message, user);
        handleRegister(user);
      });
    })
    .catch(err => {
      console.log(err);
    });
}

//Begin the registration process with a user in their DMs
function handleRegister(user) {
  user
    .createDM()
    .then(dmChannel => {
      let newMember = new Member();
      newMember = {
        discordId: user.id,
        tag: user.tag,
      };

      dmChannel.send(
        `Hi ${user.username}! Welcome to Seattle HSE! We just have a few questions that will get you set up in the server.`
      );

      setTimeout(() => {
        dmChannel.send(
          `First off, what's your name? (Please respond with your full name eg. John Doe)`
        );
      }, 1000);
      getUserResponseFromDM(dmChannel)
        .then(res => {
          newMember.fullname = res;
        })
        .then(() => {
          dmChannel.send(`Great! Nice to meet you ${newMember.fullname}!`);
          getGradeLevel(dmChannel).then(res => {
            newMember.grade = res;
            getSchool(dmChannel).then(res => {
              newMember.school = res;
              getValInfo(dmChannel)
                .then(valInfo => {
                  newMember.valorant = valInfo;
                  memberManager
                    .create(newMember)
                    .then(member => {
                      console.log(newMember);
                      addPostRegistrationRoles(user, newMember)
                        .then(() => {
                          dmChannel.send(
                            `**Congratulations! You've been added to the member database! You should now have full access to the server, have fun!**`
                          );
                          setTimeout(() => {
                            dmChannel.send(
                              `*If encountered any unexpected issues with this bot please DM it's creator: @UTHD#9085*`
                            );
                          }, 1000);
                        })
                        .catch(err => {
                          console.log(err);
                          dmChannel.send(
                            `There was an error adding you. (Perhaps you're already registered?)`
                          );
                          setTimeout(() => {
                            dmChannel.send(
                              `*If encountered any unexpected issues with this bot please DM it's creator: @UTHD#9085*`
                            );
                          }, 1000);
                        });
                    })
                    .catch(err => {
                      console.log(err);
                      dmChannel.send(
                        `There was an error adding you're. (Perhaps you already registered?)`
                      );
                      setTimeout(() => {
                        dmChannel.send(
                          `*If encountered any unexpected issues with this bot please DM it's creator: @UTHD#9085*`
                        );
                      }, 1000);
                    });
                })
                .catch(err => {
                  console.log(err);
                });
            });
          });
        });
    })
    .catch(err => {
      console.log(err);
    });
}

function getGuildMember(user) {
  return new Promise((resolve, reject) => {
    let server = client.guilds.cache.get("833801666557247528"); //get guild (server) by id
    let member = server.members.cache.get(user.id);
    resolve(member);
  });
}

function addPostRegistrationRoles(user, newMember) {
  return new Promise((resolve, reject) => {
    let server = client.guilds.cache.get("833801666557247528"); //get guild (server) by id

    let newMemberRoleIds = [registeredRoleId];
    newMemberRoleIds.push(schoolRoleIds[newMember.school]); //Adds role ID for school
    if (newMember.valorant.active) {
      newMemberRoleIds.push(valRoleId);
      newMemberRoleIds.push(valRankRoleIds[newMember.valorant.rank]);
    }

    let getNewMemberRolesFromIds = newMemberRoleIds.map(roleId => {
      return new Promise((resolve, reject) => {
        server.roles
          .fetch(roleId)
          .then(role => {
            resolve(role);
          })
          .catch(err => {
            reject(err);
          });
      });
    });

    Promise.all(getNewMemberRolesFromIds).then(roles => {
      getGuildMember(user).then(member => {
        member.setNickname(newMember.valorant.ign);
        member.roles
          .add(roles, "New Register")
          .then(() => {
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  });
}

function getValInfo(dmChannel) {
  return new Promise((resolve, reject) => {
    dmChannel.send(
      `Do you play valorant / want to participate in Valorant events in this server? (yes / no)`
    );
    getUserResponseFromDM(dmChannel).then(res => {
      if (res === "yes") {
        let valInfo = {
          active: true,
          rank: 0,
          ign: "",
        };
        getValPlayerInfo(dmChannel, valInfo)
          .then(valInfo => {
            console.log(`valInfo: ${valInfo}`);
            resolve(valInfo);
          })
          .catch(err => {
            reject(err);
          });
      } else if (res === "no") {
        resolve({
          active: false,
          rank: 0,
          ign: "",
        });
      } else {
        dmChannel.send(`Invalid Response!`);
        getValInfo(dmChannel);
      }
    });
  });
}

function getValPlayerInfo(dmChannel, valInfo) {
  return new Promise((resolve, reject) => {
    dmChannel.send(
      `Cool! What's your IGN for Valorant? (In-game name, eg. UTHD#9085)`
    );
    getUserResponseFromDM(dmChannel)
      .then(res => {
        valInfo.ign = res;
        dmChannel.send(
          `And your rank? (eg. iron, bronze, silver; without the numbers)`
        );
        getUserResponseFromDM(dmChannel).then(res => {
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
          if (ranks.includes(res.toLowerCase())) {
            console.log(`Correct Rank: ${res}`);
            let rankNumber = ranks.indexOf(res);
            valInfo.rank = rankNumber;
            resolve(valInfo);
          } else {
            console.log(`Invalid Rank: ${res}`);
            dmChannel.send(`The rank you entered is invalid! Try again.`);
            getValPlayerInfo(dmChannel, valInfo);
          }
        });
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getSchool(dmChannel) {
  return new Promise((resolve, reject) => {
    dmChannel.send(
      `What school do you go to? (respond with ghs, chs, ihs, rhs, fhs)`
    );
    getUserResponseFromDM(dmChannel)
      .then(res => {
        let allowedResps = ["ghs", "chs", "ihs", "rhs", "fhs"];
        if (allowedResps.includes(res)) {
          console.log(`School: ${res}`);
          resolve(res);
        } else {
          dmChannel.send(`Uh Oh! That's not a valid school!`);
          getSchool(dmChannel);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getGradeLevel(dmChannel) {
  return new Promise((resolve, reject) => {
    dmChannel.send(`What grade are you in? (respond with a number 8-12)`);
    getUserResponseFromDM(dmChannel)
      .then(res => {
        let allowedResps = ["8", "9", "10", "11", "12"];
        if (allowedResps.includes(res)) {
          console.log(`Grade: ${res}`);
          resolve(res);
        } else {
          console.log(res);
          dmChannel.send(`Uh Oh! That's not a valid grade!`);
          getGradeLevel(dmChannel);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getUserResponseFromDM(dmChannel) {
  return new Promise((resolve, reject) => {
    let collector = dmChannel.createMessageCollector(msg => !msg.author.bot, {
      max: 1,
      time: 60000,
    });
    collector.on("collect", msg => {
      resolve(msg.content);
    });
  });
}

//Remove a user's reactions to a message
function removeUserReaction(message, user) {
  const userReactions = message.reactions.cache.filter(reaction =>
    reaction.users.cache.has(user.id)
  );
  try {
    for (const reaction of userReactions.values()) {
      reaction.users.remove(user.id);
    }
  } catch (error) {
    console.error("Failed to remove reactions.");
    console.log(error);
  }
}

client.login(process.env.BOT_TOKEN);
