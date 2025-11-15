/**
 * ===========================================================
 * 🧑‍💻 Author: Sheikh Tamim (ST | Sheikh Tamim)
 * 🔰 Owner & Developer
 * 🌐 GitHub: https://github.com/sheikhtamimlover
 * 📸 Instagram: https://instagram.com/sheikh.tamim_lover
 * -----------------------------------------------------------
 * 🕊️ Respect the creator & give proper credits if reused.
 * ===========================================================
 */
"use strict";

const utils = require("../utils");

module.exports = function (defaultFuncs, api, ctx) {
  /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
  return function friendList(callback) {
    let resolveFunc = function () {};
    let rejectFunc = function () {};
    const returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, friendList) {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(friendList);
      };
    }

    const form = {
      av: ctx.userID,
      __user: ctx.userID,
      __a: 1,
      __req: utils.getSignatureID(),
      __hs: "20353.HYP:comet_pkg.2.1...0",
      dpr: 1,
      __ccg: "EXCELLENT",
      __rev: "1027407131",
      __s: utils.getSignatureID(),
      __hsi: "7552796416884228248",
      __comet_req: 15,
      fb_dtsg: ctx.fb_dtsg,
      jazoest: ctx.ttstamp,
      lsd: ctx.fb_dtsg,
      __spin_r: "1027407131",
      __spin_b: "trunk",
      __spin_t: Date.now(),
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "FriendingCometAllFriendsRootQuery",
      variables: JSON.stringify({ scale: 2 }),
      server_timestamps: true,
      doc_id: "24426868700236815"
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (!resData || !resData.data) {
          throw { error: "friendList returned empty object." };
        }
        if (resData.error) {
          throw resData;
        }

        const friendsData = resData.data.viewer?.all_friends?.edges || [];
        const formattedFriends = friendsData.map(edge => {
          const friend = edge.node;
          return {
            userID: friend.id,
            name: friend.name,
            shortName: friend.short_name,
            gender: friend.gender,
            profilePicture: friend.profile_picture?.uri || null,
            profileUrl: friend.url,
            friendshipStatus: friend.friendship_status,
            socialContext: friend.social_context?.text || "",
            isSecureThread: friend.is_secure_thread,
            subscribeStatus: friend.subscribe_status
          };
        });

        const result = {
          totalCount: resData.data.viewer?.all_friends_data?.count || 0,
          friendCount: resData.data.viewer?.all_friends_data?.friend_count || 0,
          friends: formattedFriends
        };

        callback(null, result);
      })
      .catch(function (err) {
        console.error("friendList", err);
        return callback(err);
      });

    return returnPromise;
  };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */