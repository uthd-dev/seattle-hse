const Member = require("./memberSchema");

exports.create = memberInfo => {
  return new Promise((resolve, reject) => {
    Member.findOne({ discordId: memberInfo.id }, function (err, member) {
      //Error first
      if (err) {
        reject(err);
      }
      //Make sure user does not already exist
      if (!member) {
        member = new Member(memberInfo);
        member.save(function (err) {
          if (err) reject(err);
          resolve(member);
        });
      } else reject(`Member exists!`);
    });
  });
};

exports.getById = discordId => {
  return new Promise((resolve, reject) => {
    Member.findOne({ discordId: discordId }, function (err, member) {
      if (err) {
        reject(err);
      }

      if (!member) {
        resolve({});
      } else resolve(member);
    });
  });
};
