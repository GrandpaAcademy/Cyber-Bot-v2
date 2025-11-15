
"use strict";

const utils = require('../utils');

/**
 * @description Enhanced module for interacting with Facebook Messenger Notes with additional features
 * @param {Object} defaultFuncs The default functions provided by the API wrapper
 * @param {Object} api The full API object
 * @param {Object} ctx The context object containing the user's session state
 * @returns {Object} An object containing enhanced methods for note management
 */
module.exports = function(defaultFuncs, api, ctx) {

  /**
   * @callback notesCallback
   * @param {Error|null} error An error object if the request fails, otherwise null
   * @param {Object} [data] The data returned from the API
   */

  /**
   * Enhanced check note function with additional user info
   */
  function checkNoteAdvanced(callback) {
    if (typeof callback !== 'function') {
      callback = () => {};
    }

    const form = {
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "MWInboxTrayNoteCreationDialogQuery",
      variables: JSON.stringify({ scale: 2 }),
      doc_id: "30899655739648624",
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(resData => {
        if (resData && resData.errors) throw resData.errors[0];
        const currentNote = resData?.data?.viewer?.actor?.msgr_user_rich_status;

        // Enhanced response with additional metadata
        const enhancedResponse = {
          note: currentNote,
          hasActiveNote: !!currentNote,
          userId: ctx.userID,
          timestamp: Date.now(),
          expiresAt: currentNote ? (currentNote.created_time * 1000) + (24 * 60 * 60 * 1000) : null
        };

        callback(null, enhancedResponse);
      })
      .catch(err => {
        utils.error && utils.error("notesv2.checkNoteAdvanced", err);
        callback(err);
      });
  }

  /**
   * Create note with enhanced privacy options and validation
   */
  function createNoteAdvanced(text, options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (typeof callback !== 'function') {
      callback = () => {};
    }

    // Validate input
    if (!text || text.trim().length === 0) {
      return callback(new Error("Note text cannot be empty"));
    }

    if (text.length > 280) {
      return callback(new Error("Note text cannot exceed 280 characters"));
    }

    const {
      privacy = "FRIENDS",
      duration = 86400,
      noteType = "TEXT_NOTE"
    } = options;

    const variables = {
      input: {
        client_mutation_id: Math.round(Math.random() * 1000000).toString(),
        actor_id: ctx.userID,
        description: text.trim(),
        duration: duration,
        note_type: noteType,
        privacy: privacy,
        session_id: utils.getGUID(),
      },
    };

    const form = {
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "MWInboxTrayNoteCreationDialogCreationStepContentMutation",
      variables: JSON.stringify(variables),
      doc_id: "24060573783603122",
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(resData => {
        if (resData && resData.errors) throw resData.errors[0];
        const status = resData?.data?.xfb_rich_status_create?.status;
        if (!status) throw new Error("Could not find note status in the server response.");

        // Enhanced response
        const enhancedResponse = {
          ...status,
          createdAt: Date.now(),
          expiresAt: Date.now() + (duration * 1000),
          characterCount: text.trim().length,
          privacy: privacy
        };

        callback(null, enhancedResponse);
      })
      .catch(err => {
        utils.error && utils.error("notesv2.createNoteAdvanced", err);
        callback(err);
      });
  }

  /**
   * Delete note with confirmation
   */
  function deleteNoteAdvanced(noteID, callback) {
    if (typeof callback !== 'function') {
      callback = () => {};
    }

    if (!noteID) {
      return callback(new Error("Note ID is required"));
    }

    const variables = {
      input: {
        client_mutation_id: Math.round(Math.random() * 1000000).toString(),
        actor_id: ctx.userID,
        rich_status_id: noteID,
      },
    };

    const form = {
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "useMWInboxTrayDeleteNoteMutation",
      variables: JSON.stringify(variables),
      doc_id: "9532619970198958",
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(resData => {
        if (resData && resData.errors) throw resData.errors[0];
        const deletedStatus = resData?.data?.xfb_rich_status_delete;
        if (!deletedStatus) throw new Error("Could not find deletion status in the server response.");

        const enhancedResponse = {
          ...deletedStatus,
          deletedAt: Date.now(),
          noteId: noteID
        };

        callback(null, enhancedResponse);
      })
      .catch(err => {
        utils.error && utils.error("notesv2.deleteNoteAdvanced", err);
        callback(err);
      });
  }

  /**
   * Update existing note (delete old and create new)
   */
  function updateNote(oldNoteID, newText, options = {}, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (typeof callback !== 'function') {
      callback = () => {};
    }

    deleteNoteAdvanced(oldNoteID, (err, deleted) => {
      if (err) {
        return callback(err);
      }

      // Wait a bit before creating new note
      setTimeout(() => {
        createNoteAdvanced(newText, options, (err, created) => {
          if (err) {
            return callback(err);
          }
          callback(null, { 
            deleted, 
            created,
            updatedAt: Date.now()
          });
        });
      }, 1000);
    });
  }

  return {
    // Enhanced functions
    checkAdvanced: checkNoteAdvanced,
    createAdvanced: createNoteAdvanced,
    deleteAdvanced: deleteNoteAdvanced,
    update: updateNote,

    // Backward compatibility
    check: checkNoteAdvanced,
    create: createNoteAdvanced,
    delete: deleteNoteAdvanced,
    recreate: updateNote
  };
};
