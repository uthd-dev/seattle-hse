let hardIDs = require("./hardIDs");

exports.addTempTeamCaptain = (msg, args, server) => {
    server.members.fetch(msg.author.id).then(member => {
      if (args.length !== 0) {
        msg.channel.send(
          "Inavlid Usage! Correct Usage: !captain while connected to a Comp/Scrim VC"
        );
        return;
      } //This command does not take arguments
      if (member.voice.channelID) {
        if (hardIDs.compVcIds.includes(member.voice.channelID)) {
          console.log(
            `${
              member.displayName
            } is attempting to become Team Captain of Comp VC. #${
              hardIDs.compVcIds.indexOf(member.voice.channelID) + 1
            }`
          );
  
          let vcRoleIndex = hardIDs.compVcIds.indexOf(member.voice.channelID);
          msg.guild.roles.fetch(hardIDs.compCaptainRoleIds[vcRoleIndex]).then(role => {
            let members = role.members;
            if (members.length > 0) {
              msg.channel.send("Someone is already Team Captain for this VC!");
            } else {
              member.roles.add(hardIDs.compCaptainRoleIds[vcRoleIndex]).then(() => {
                msg.channel.send(
                  `You are now the team captain of ${member.voice.channel} until you disconnect.`
                );
                console.log(`${member.displayName} is now a Comp Team Captain.`);
              });
            }
          });
        } else if (hardIDs.scrimVcIds.includes(member.voice.channelID)) {
          console.log(
            `${
              member.displayName
            } is attempting to become Team Captain of Scrim Team #${
              hardIDs.scrimVcIds.indexOf(member.voice.channelID) + 1
            }`
          );
  
          let vcRoleIndex = hardIDs.scrimVcIds.indexOf(member.voice.channelID);
          msg.guild.roles.fetch(hardIDs.scrimCaptainRoleIds[vcRoleIndex]).then(role => {
            let members = role.members;
            if (members.length > 0) {
              msg.channel.send("Someone is already Team Captain for this VC!");
            } else {
              member.roles.add(hardIDs.scrimCaptainRoleIds[vcRoleIndex]).then(() => {
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

exports.removeCaptain = (oldState, newState) => {
    console.log(`${oldState.member.displayName} left ${oldState.channelID}`);
    let channelID = oldState.channelID;
    if (hardIDs.compVcIds.includes(channelID)) {
      let index = hardIDs.compVcIds.indexOf(channelID);
      if (oldState.member.roles.cache.has(hardIDs.compCaptainRoleIds[index])) {
        oldState.member.roles.remove(hardIDs.compCaptainRoleIds[index]);
        console.log(
          `${oldState.member.displayName} is no longer a Comp Team Captain.`
        );
      }
    } else if (hardIDs.scrimVcIds.includes(channelID)) {
      let index = hardIDs.scrimVcIds.indexOf(channelID);
      if (oldState.member.roles.cache.has(hardIDs.scrimCaptainRoleIds[index])) {
        oldState.member.roles.remove(hardIDs.scrimCaptainRoleIds[index]);
        console.log(
          `${oldState.member.displayName} is no longer a Scrim Team Captain.`
        );
      }
    }
  }