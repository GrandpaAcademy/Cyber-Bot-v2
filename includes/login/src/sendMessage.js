"use strict";

const utils = require("../utils");

const allowedProperties = {
  attachment: true,
  url: true,
  sticker: true,
  emoji: true,
  emojiSize: true,
  body: true,
  mentions: true,
  location: true,
};

module.exports = (defaultFuncs, api, ctx) => {
  async function uploadAttachment(attachments) {
    const uploads = [];
    for (let i = 0; i < attachments.length; i++) {
      if (!utils.isReadableStream(attachments[i])) {
        throw new Error("Attachment should be a readable stream and not " + utils.getType(attachments[i]) + ".");
      }
      const response = await defaultFuncs.postFormData("https://upload.facebook.com/ajax/mercury/upload.php", ctx.jar, {
        upload_1024: attachments[i],
        voice_clip: "true"
      }).then(utils.parseAndCheckLogin(ctx, defaultFuncs));
      
      if (response.error) {
        throw new Error(response.error || "Upload failed");
      }
      uploads.push(response.payload.metadata[0]);
    }
    return uploads;
  }

  async function getUrl(url) {
    const response = await defaultFuncs.post("https://www.facebook.com/message_share_attachment/fromURI/", ctx.jar, {
      image_height: 960,
      image_width: 960,
      uri: url
    }).then(utils.parseAndCheckLogin(ctx, defaultFuncs));
    
    if (!response || response.error || !response.payload) {
      throw new Error(response?.error || "Invalid response from URL attachment");
    }
    
    return response.payload.share_data.share_params;
  }

  async function sendContent(form, threadID, isSingleUser, messageAndOTID) {
    // There are three cases here:
    // 1. threadID is of type array, where we're starting a new group chat with users
    //    specified in the array.
    // 2. User is sending a message to a specific user.
    // 3. No additional form params and the message goes to an existing group chat.
    if (utils.getType(threadID) === "Array") {
      for (let i = 0; i < threadID.length; i++) {
        form["specific_to_list[" + i + "]"] = "fbid:" + threadID[i];
      }
      form["specific_to_list[" + threadID.length + "]"] = "fbid:" + ctx.userID;
      form["client_thread_id"] = "root:" + messageAndOTID;
      utils.log("sendMessage", "Sending message to multiple users: " + threadID);
    } else {
      // This means that threadID is the id of a user, and the chat
      // is a single person chat
      if (isSingleUser) {
        form["specific_to_list[0]"] = "fbid:" + threadID;
        form["specific_to_list[1]"] = "fbid:" + ctx.userID;
        form["other_user_fbid"] = threadID;
      } else {
        form["thread_fbid"] = threadID;
      }
    }

    if (ctx.globalOptions.pageID) {
      form["author"] = "fbid:" + ctx.globalOptions.pageID;
      form["specific_to_list[1]"] = "fbid:" + ctx.globalOptions.pageID;
      form["creator_info[creatorID]"] = ctx.userID;
      form["creator_info[creatorType]"] = "direct_admin";
      form["creator_info[labelType]"] = "sent_message";
      form["creator_info[pageID]"] = ctx.globalOptions.pageID;
      form["request_user_id"] = ctx.globalOptions.pageID;
      form["creator_info[profileURI]"] = "https://www.facebook.com/profile.php?id=" + ctx.userID;
    }

    const response = await defaultFuncs.post("https://www.facebook.com/messaging/send/", ctx.jar, form).then(utils.parseAndCheckLogin(ctx, defaultFuncs));
    
    if (!response) {
      throw new Error("Send message failed.");
    }
    
    if (response.error) {
      if (response.error === 1545012) {
        utils.warn("sendMessage", "Got error 1545012. This might mean that you're not part of the conversation " + threadID);
      }
      throw new Error(response.error);
    }
    
    const messageInfo = response.payload.actions.reduce((p, v) => {
      return { threadID: v.thread_fbid, messageID: v.message_id, timestamp: v.timestamp } || p;
    }, null);
    
    return messageInfo;
  }

  return async (msg, threadID, replyToMessage, isSingleUser = false) => {
    let msgType = utils.getType(msg);
    let threadIDType = utils.getType(threadID);
    let messageIDType = utils.getType(replyToMessage);
    
    if (msgType !== "String" && msgType !== "Object") {
      throw new Error("Message should be of type string or object and not " + msgType + ".");
    }
    if (threadIDType !== "Array" && threadIDType !== "Number" && threadIDType !== "String") {
      throw new Error("ThreadID should be of type number, string, or array and not " + threadIDType + ".");
    }
    if (replyToMessage && messageIDType !== 'String') {
      throw new Error("MessageID should be of type string and not " + messageIDType + ".");
    }
    
    if (msgType === "String") {
      msg = { body: msg };
    }
    
    const disallowedProperties = Object.keys(msg).filter(prop => !allowedProperties[prop]);
    if (disallowedProperties.length > 0) {
      throw new Error("Dissallowed props: `" + disallowedProperties.join(", ") + "`");
    }
    
    const messageAndOTID = utils.generateOfflineThreadingID();
    const form = {
      client: "mercury",
      action_type: "ma-type:user-generated-message",
      author: "fbid:" + ctx.userID,
      timestamp: Date.now(),
      timestamp_absolute: "Today",
      timestamp_relative: utils.generateTimestampRelative(),
      timestamp_time_passed: "0",
      is_unread: false,
      is_cleared: false,
      is_forward: false,
      is_filtered_content: false,
      is_filtered_content_bh: false,
      is_filtered_content_account: false,
      is_filtered_content_quasar: false,
      is_filtered_content_invalid_app: false,
      is_spoof_warning: false,
      source: "source:chat:web",
      "source_tags[0]": "source:chat",
      ...(msg.body && { body: msg.body }),
      html_body: false,
      ui_push_phase: "V3",
      status: "0",
      offline_threading_id: messageAndOTID,
      message_id: messageAndOTID,
      threading_id: utils.generateThreadingID(ctx.clientID),
      "ephemeral_ttl_mode:": "0",
      manual_retry_cnt: "0",
      has_attachment: !!(msg.attachment || msg.url || msg.sticker),
      signatureID: utils.getSignatureID(),
      ...(replyToMessage && { replied_to_message_id: replyToMessage })
    };

    if (msg.location) {
      if (!msg.location.latitude || !msg.location.longitude) {
        throw new Error("location property needs both latitude and longitude");
      }
      form["location_attachment[coordinates][latitude]"] = msg.location.latitude;
      form["location_attachment[coordinates][longitude]"] = msg.location.longitude;
      form["location_attachment[is_current_location]"] = !!msg.location.current;
    }
    
    if (msg.sticker) {
      form["sticker_id"] = msg.sticker;
    }
    
    if (msg.attachment) {
      form.image_ids = [];
      form.gif_ids = [];
      form.file_ids = [];
      form.video_ids = [];
      form.audio_ids = [];
      
      if (utils.getType(msg.attachment) !== "Array") {
        msg.attachment = [msg.attachment];
      }
      
      const files = await uploadAttachment(msg.attachment);
      files.forEach(file => {
        const type = Object.keys(file)[0];
        form["" + type + "s"].push(file[type]);
      });
    }
    
    if (msg.url) {
      form["shareable_attachment[share_type]"] = "100";
      const params = await getUrl(msg.url);
      form["shareable_attachment[share_params]"] = params;
    }
    
    if (msg.emoji) {
      if (!msg.emojiSize) {
        msg.emojiSize = "medium";
      }
      if (msg.emojiSize !== "small" && msg.emojiSize !== "medium" && msg.emojiSize !== "large") {
        throw new Error("emojiSize property is invalid");
      }
      if (!form.body) {
        throw new Error("body is not empty");
      }
      form.body = msg.emoji;
      form["tags[0]"] = "hot_emoji_size:" + msg.emojiSize;
    }
    
    if (msg.mentions) {
      for (let i = 0; i < msg.mentions.length; i++) {
        const mention = msg.mentions[i];
        const tag = mention.tag;
        if (typeof tag !== "string") {
          throw new Error("Mention tags must be strings.");
        }
        const offset = msg.body.indexOf(tag, mention.fromIndex || 0);
        if (offset < 0) utils.warn("handleMention", 'Mention for "' + tag + '" not found in message string.');
        if (!mention.id) utils.warn("handleMention", "Mention id should be non-null.");
        const id = mention.id || 0;
        form["profile_xmd[" + i + "][offset]"] = offset;
        form["profile_xmd[" + i + "][length]"] = tag.length;
        form["profile_xmd[" + i + "][id]"] = id;
        form["profile_xmd[" + i + "][type]"] = "p";
      }
    }
    
    const result = await sendContent(form, threadID, isSingleUser, messageAndOTID);
    return result;
  };
};
