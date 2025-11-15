// By @sheikhtamimlover0
"use strict";

const utils = require("../utils");
const log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
     /** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Instagram: @sheikh.tamim_lover */
	return function removeSuspiciousAccount(callback) {
		let resolveFunc = function () {};
		let rejectFunc = function () {};
		const returnPromise = new Promise(function (resolve, reject) {
			resolveFunc = resolve;
			rejectFunc = reject;
		});

		if (!callback) {
			callback = function (err, data) {
				if (err) return rejectFunc(err);
				resolveFunc(data);
			};
		}

		const form = {
			av: ctx.userID,
			__user: ctx.userID,
			__a: "1",
			__req: utils.getGUID(),
			__hs: utils.getEventTime(),
			dpr: "1",
			__ccg: "EXCELLENT",
			__rev: "1029700657",
			__s: utils.getSessionID(),
			__hsi: utils.getEventTime(),
			__dyn: ctx.__dyn || "",
			__csr: ctx.__csr || "",
			__comet_req: "15",
			fb_dtsg: ctx.fb_dtsg || "",
			jazoest: utils.getJazoest(ctx.fb_dtsg),
			lsd: utils.getFormData(ctx.jar, "https://www.facebook.com")?.lsd || "J4SCzL5WXd7KIzVF0tdxFm",
			__spin_r: "1029700657",
			__spin_b: "trunk",
			__spin_t: utils.getEventTime(),
			fb_api_caller_class: "RelayModern",
			fb_api_req_friendly_name: "FBScrapingWarningMutation",
			server_timestamps: "true",
			variables: "{}",
			doc_id: "24406519995698862"
		};

		defaultFuncs
			.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
			.then(utils.parseAndCheckLogin(ctx, defaultFuncs))
			.then(function (resData) {
				if (resData.error) {
					throw resData;
				}

				log.info("removeSuspiciousAccount", "Successfully removed suspicious account warning");
				callback(null, { success: true, message: "Suspicious account warning removed" });
			})
			.catch(function (err) {
				log.error("removeSuspiciousAccount", err);
				return callback(err);
			});

		return returnPromise;
	};
};
/** Developed by Sheikh Tamim | GitHub: sheikhtamimlover | Please give credits if reused. */