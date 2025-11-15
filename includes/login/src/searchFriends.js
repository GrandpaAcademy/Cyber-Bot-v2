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
  return function searchFriends(searchQuery, callback) {
    let resolveFunc = function () {};
    let rejectFunc = function () {};
    const returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, result) {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(result);
      };
    }

    if (!searchQuery || searchQuery.trim().length === 0) {
      return callback(new Error("Search query cannot be empty"));
    }

    // Enhanced form data based on captured API
    const form = {
      av: ctx.userID,
      __aaid: 0,
      __user: ctx.userID,
      __a: 1,
      __req: utils.getSignatureID(),
      __hs: "20358.HYP:comet_pkg.2.1...0",
      dpr: 1,
      __ccg: "EXCELLENT",
      __rev: "1027694919",
      __s: utils.getSignatureID(),
      __hsi: "7554748243252799467",
      __comet_req: 15,
      fb_dtsg: ctx.fb_dtsg,
      jazoest: ctx.ttstamp,
      lsd: ctx.fb_dtsg,
      __spin_r: "1027694919",
      __spin_b: "trunk",
      __spin_t: Date.now(),
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "ProfileCometAppCollectionSelfFriendsListRendererPaginationQuery",
      variables: JSON.stringify({
        count: 20, // Increased count for better results
        cursor: null,
        scale: 1,
        search: searchQuery.trim(),
        id: "YXBwX2NvbGxlY3Rpb246cGZiaWQwMkJSM3NDeXRjNkJIeVVXem9OeUxNcjNoYnVDclRFZkdCcVlEaXZuSlZYOUNLR2pXVmRyYTQ4U29FalJTVzduMm03NlhDa0xEQXAybVVUenF6RXZraGc3ZHkyaGw="
      }),
      server_timestamps: true,
      doc_id: "31767020089578751"
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (!resData || !resData.data) {
          throw { error: "searchFriends returned empty object." };
        }
        if (resData.error) {
          throw resData;
        }

        const friendsData = resData.data.node?.pageItems?.edges || [];
        const formattedFriends = friendsData.map(edge => {
          const friend = edge.node;
          const friendUser = friend.node || friend;
          
          // Extract mutual friends count from subtitle
          let mutualFriends = 0;
          if (friend.subtitle_text?.text) {
            const mutualMatch = friend.subtitle_text.text.match(/(\d+)\s+mutual\s+friend/i);
            if (mutualMatch) {
              mutualFriends = parseInt(mutualMatch[1]);
            }
          }
          
          return {
            userID: friendUser.id || friend.id,
            name: friend.title?.text || friendUser.name || friend.name,
            profilePicture: friend.image?.uri || null,
            profileUrl: friend.url || friendUser.url,
            subtitle: friend.subtitle_text?.text || "",
            mutualFriends: mutualFriends,
            // Additional fields from the captured API
            cursor: edge.cursor,
            friendshipStatus: friendUser.friendship_status || "UNKNOWN",
            gender: friendUser.gender || null,
            shortName: friendUser.short_name || null
          };
        }).filter(friend => friend.userID && friend.name);

        // Sort by relevance (exact matches first, then by mutual friends)
        formattedFriends.sort((a, b) => {
          const queryLower = searchQuery.toLowerCase();
          const aNameLower = a.name.toLowerCase();
          const bNameLower = b.name.toLowerCase();
          
          // Exact matches first
          if (aNameLower === queryLower && bNameLower !== queryLower) return -1;
          if (bNameLower === queryLower && aNameLower !== queryLower) return 1;
          
          // Then by starts with
          if (aNameLower.startsWith(queryLower) && !bNameLower.startsWith(queryLower)) return -1;
          if (bNameLower.startsWith(queryLower) && !aNameLower.startsWith(queryLower)) return 1;
          
          // Then by mutual friends count
          return b.mutualFriends - a.mutualFriends;
        });

        callback(null, formattedFriends);
      })
      .catch(function (err) {
        console.error("searchFriends error:", err);
        return callback(err);
      });

    return returnPromise;
  };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */