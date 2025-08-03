module.exports.config = {
  name: "acp",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
  description: "Make friends via Facebook id",
  commandCategory: "bot id",
  usages: "uid",
  cooldowns: 0
};


module.exports.handleReply = async ({ handleReply, event, api }) => {
  const { author, listRequest } = handleReply;
  if (author != event.senderID) return;
  const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");
  
  const form = {
    av: api.getCurrentUserID(),
		fb_api_caller_class: "RelayModern",
		variables: {
      input: {
        source: "friends_tab",
        actor_id: api.getCurrentUserID(),
        client_mutation_id: Math.round(Math.random() * 19).toString()
      },
      scale: 3,
      refresh_num: 0
		}
  };
  
  const success = [];
  const failed = [];
  
  if (args[0] == "add") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  }
  else if (args[0] == "del") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  }
  else return api.sendMessage("Please choose <add | del > <numerical order | or \"all\">", event.threadID, event.messageID);
  let targetIDs = args.slice(1);
  
  if (args[1] == "all") {
    targetIDs = [];
    const lengthList = listRequest.length;
    for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
  }
  
  const newTargetIDs = [];
  const promiseFriends = [];
  
  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`stt not found ${stt} in the list`);
      continue;
    }
    form.variables.input.friend_requester_id = u.node.id;
    form.variables = JSON.stringify(form.variables);
    newTargetIDs.push(u);
    promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
		form.variables = JSON.parse(form.variables);
  }
  
  const lengthTarget = newTargetIDs.length;
  for (let i = 0; i < lengthTarget; i++) {
    try {
      const friendRequest = await promiseFriends[i];
      if (JSON.parse(friendRequest).errors) failed.push(newTargetIDs[i].node.name);
      else success.push(newTargetIDs[i].node.name);
    }
    catch(e) {
      failed.push(newTargetIDs[i].node.name);
    }
  }
  
  api.sendMessage(`» Đã ${args[0] == 'add' ? 'accept' : 'erase'} successful friend request of ${success.length} People:\n${success.join("\n")}${failed.length > 0 ? `\n» Fail with ${failed.length} People: ${failed.join("\n")}` : ""}`, event.threadID, event.messageID);
};


module.exports.run = async ({ event, api }) => {
  const moment = require("moment-timezone");
  const form = {
    av: api.getCurrentUserID(),
  	fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
  	fb_api_caller_class: "RelayModern",
  	doc_id: "4499164963466303",
  	variables: JSON.stringify({input: {scale: 3}})
  };
  const listRequest = JSON.parse(await api.httpPost("https://www.facebook.com/api/graphql/", form)).data.viewer.friending_possibilities.edges;
  let msg = "";
  let i = 0;
  for (const user of listRequest) {
    i++;
    msg += (`\n${i}. Name: ${user.node.name}`
         + `\nID: ${user.node.id}`
         + `\nUrl: ${user.node.url.replace("www.facebook", "fb")}`
         + `\nTime: ${moment(user.time*1009).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n`);
  }
  api.sendMessage(`${msg}\nReply to this message with content: <add | del> <numerical order | or \"all\"> to take action`, event.threadID, (e, info) => {
      global.client.handleReply.push({
        name: this. config. name,
        messageID: info.messageID,
        listRequest,
        author: event.senderID
      });
    }, event.messageID);
};
