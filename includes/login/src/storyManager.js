// By @sheikhtamimlover0
'use strict';

var utils = require('../utils.js');
var log = require('npmlog');

module.exports = function(defaultFuncs, api, ctx) {
     /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
  return function storyManager(options, callback) {
    var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (!options || typeof options !== 'object') {
      return callback({ error: "Options object is required" });
    }

    const { action, attachment, storyID } = options;

    if (!action || !['add', 'upload', 'delete', 'check'].includes(action)) {
      return callback({ error: "Action must be 'add', 'upload', 'delete', or 'check'" });
    }

    // Helper function to upload story attachment
    function uploadStoryAttachment(attachment) {
      return new Promise((resolve, reject) => {
        if (!utils.isReadableStream(attachment)) {
          return reject({ error: 'Attachment should be a readable stream and not ' + utils.getType(attachment) });
        }

        const uploadForm = {
          source: "8",
          profile_id: ctx.userID,
          waterfallxapp: "comet_stories",
          farr: attachment,
          upload_id: "jsc_c_m"
        };

        const uploadUrl = `https://upload.facebook.com/ajax/react_composer/attachments/photo/upload?av=${ctx.userID}&__aaid=0&__user=${ctx.userID}&__a=1&__req=${utils.getSignatureID()}&__hs=${ctx.fb_dtsg_ag}&dpr=1&__ccg=EXCELLENT&__rev=${ctx.req_ID}&__s=${utils.getSignatureID()}&__hsi=${ctx.hsi}&__comet_req=15&fb_dtsg=${ctx.fb_dtsg}&jazoest=${ctx.ttstamp}&lsd=${ctx.fb_dtsg}&__spin_r=${ctx.req_ID}&__spin_b=trunk&__spin_t=${Date.now()}`;

        defaultFuncs
          .postFormData(uploadUrl, ctx.jar, uploadForm)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error || !resData.payload || !resData.payload.photoID) {
              throw resData || { error: "Upload failed - no photo ID returned" };
            }
            resolve(resData.payload.photoID);
          })
          .catch(reject);
      });
    }

    // Helper function to create story
    function createStory(photoID) {
      return new Promise((resolve, reject) => {
        const form = {
          av: ctx.userID,
          __aaid: 0,
          __user: ctx.userID,
          __a: 1,
          __req: utils.getSignatureID(),
          __hs: ctx.fb_dtsg_ag,
          dpr: 1,
          __ccg: "EXCELLENT",
          __rev: ctx.req_ID,
          __s: utils.getSignatureID(),
          __hsi: ctx.hsi,
          __comet_req: 15,
          fb_dtsg: ctx.fb_dtsg,
          jazoest: ctx.ttstamp,
          lsd: ctx.fb_dtsg,
          __spin_r: ctx.req_ID,
          __spin_b: "trunk",
          __spin_t: Date.now(),
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "StoriesCreateMutation",
          variables: JSON.stringify({
            input: {
              audiences: [{
                stories: {
                  self: {
                    target_id: ctx.userID
                  }
                }
              }],
              audiences_is_complete: true,
              logging: {
                composer_session_id: `${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 4)}-${Math.random().toString(36).substring(2, 4)}-${Math.random().toString(36).substring(2, 4)}-${Math.random().toString(36).substring(2, 12)}`
              },
              navigation_data: {
                attribution_id_v2: `StoriesCreateRoot.react,comet.stories.create,unexpected,${Date.now()},545826,,;CometHomeRoot.react,comet.home,tap_tabbar,${Date.now()},661597,4748854339,,`
              },
              source: "WWW",
              attachments: [{
                photo: {
                  id: photoID,
                  overlays: []
                }
              }],
              tracking: [null],
              actor_id: ctx.userID,
              client_mutation_id: String(Math.floor(Math.random() * 16) + 1)
            }
          }),
          server_timestamps: true,
          doc_id: "24226878183562473"
        };

        defaultFuncs
          .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error || !resData.data || !resData.data.story_create) {
              throw resData || { error: "Story creation failed" };
            }

            // Extract story ID from response
            let extractedStoryId = null;
            const storyData = resData.data.story_create;
            
            try {
              if (storyData.viewer && storyData.viewer.actor && storyData.viewer.actor.story_bucket) {
                const storyNodes = storyData.viewer.actor.story_bucket.nodes;
                if (storyNodes && storyNodes.length > 0 && storyNodes[0].first_story_to_show) {
                  extractedStoryId = storyNodes[0].first_story_to_show.id;
                }
              }
            } catch (e) {
              log.warn("createStory", "Could not extract story ID from response:", e);
            }

            resolve({
              story_id: extractedStoryId,
              logging_token: storyData.logging_token,
              full_response: resData
            });
          })
          .catch(reject);
      });
    }

    // Helper function to delete story
    function deleteStory(storyID) {
      return new Promise((resolve, reject) => {
        const form = {
          av: ctx.userID,
          __aaid: 0,
          __user: ctx.userID,
          __a: 1,
          __req: utils.getSignatureID(),
          __hs: ctx.fb_dtsg_ag,
          dpr: 1,
          __ccg: "EXCELLENT",
          __rev: ctx.req_ID,
          __s: utils.getSignatureID(),
          __hsi: ctx.hsi,
          __comet_req: 15,
          fb_dtsg: ctx.fb_dtsg,
          jazoest: ctx.ttstamp,
          lsd: ctx.fb_dtsg,
          __spin_r: ctx.req_ID,
          __spin_b: "trunk",
          __spin_t: Date.now(),
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "StoriesDeleteCardOptionMenuItem_StoriesDeleteMutation",
          variables: JSON.stringify({
            input: {
              story_ids: [storyID],
              actor_id: ctx.userID,
              client_mutation_id: String(Math.floor(Math.random() * 16) + 1)
            },
            enable_profile_story_consumption: false
          }),
          server_timestamps: true,
          doc_id: "30236153679305121"
        };

        defaultFuncs
          .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) {
              throw resData;
            }
            
            if (!resData.data || !resData.data.stories_delete) {
              throw { error: "Delete response missing expected data" };
            }

            resolve({
              deleted_story_ids: resData.data.stories_delete.deleted_story_thread_ids || [storyID],
              success: true
            });
          })
          .catch(reject);
      });
    }

    // Helper function to check user stories
    function checkUserStories() {
      return new Promise((resolve, reject) => {
        const form = {
          av: ctx.userID,
          __aaid: 0,
          __user: ctx.userID,
          __a: 1,
          __req: utils.getSignatureID(),
          __hs: ctx.fb_dtsg_ag,
          dpr: 1,
          __ccg: "EXCELLENT",
          __rev: ctx.req_ID,
          __s: utils.getSignatureID(),
          __hsi: ctx.hsi,
          __comet_req: 15,
          fb_dtsg: ctx.fb_dtsg,
          jazoest: ctx.ttstamp,
          lsd: ctx.fb_dtsg,
          __spin_r: ctx.req_ID,
          __spin_b: "trunk",
          __spin_t: Date.now(),
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "CometStoriesSuspenseViewerPaginationQuery",
          variables: JSON.stringify({
            count: 50,
            scale: 1,
            id: ctx.userID
          }),
          server_timestamps: true,
          doc_id: "7723194127725452"
        };

        defaultFuncs
          .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(function (resData) {
            if (resData.error) {
              throw resData;
            }

            let stories = [];
            try {
              if (resData.data && resData.data.node && resData.data.node.story_bucket) {
                const storyBucket = resData.data.node.story_bucket;
                if (storyBucket.unified_stories && storyBucket.unified_stories.edges) {
                  stories = storyBucket.unified_stories.edges.map(edge => ({
                    id: edge.node.id,
                    creation_time: edge.node.creation_time,
                    attachments: edge.node.attachments || [],
                    bucket_id: storyBucket.id
                  }));
                }
              }
            } catch (e) {
              log.warn("checkUserStories", "Error parsing stories:", e);
            }

            resolve(stories);
          })
          .catch(reject);
      });
    }

    // Execute based on action
    switch (action) {
      case 'upload':
        if (!attachment) {
          return callback({ error: "Attachment is required for upload action" });
        }
        uploadStoryAttachment(attachment)
          .then(photoID => {
            callback(null, { success: true, photoID: photoID });
          })
          .catch(callback);
        break;

      case 'add':
        if (!attachment) {
          return callback({ error: "Attachment is required for add action" });
        }
        uploadStoryAttachment(attachment)
          .then(photoID => {
            return createStory(photoID).then(result => ({ photoID, result }));
          })
          .then(({ photoID, result }) => {
            callback(null, {
              success: true,
              story_id: result.story_id,
              logging_token: result.logging_token,
              photoID: photoID,
              full_response: result.full_response
            });
          })
          .catch(err => {
            log.error("storyManager add", err);
            callback(err);
          });
        break;

      case 'delete':
        if (!storyID) {
          return callback({ error: "Story ID is required for delete action" });
        }
        deleteStory(storyID)
          .then(result => {
            callback(null, {
              success: true,
              deleted_story_ids: result.deleted_story_ids
            });
          })
          .catch(err => {
            log.error("storyManager delete", err);
            callback(err);
          });
        break;

      case 'check':
        checkUserStories()
          .then(stories => {
            callback(null, {
              success: true,
              stories: stories,
              count: stories ? stories.length : 0
            });
          })
          .catch(err => {
            log.error("storyManager check", err);
            callback(err);
          });
        break;

      default:
        callback({ error: "Invalid action" });
    }

    return returnPromise;
  };
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */
