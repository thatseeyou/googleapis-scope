"use strict";
var google = require('googleapis');
var extsprintf_1 = require('extsprintf');
var discovery = google.discovery({
    version: 'v1',
});
function getScopeMethods(name, version, callback) {
    discovery.apis.getRest({ api: name, version: version }, function getRestCb(err, body, response) {
        if (err) {
            callback(err);
            return;
        }
        var publicScope = 'public';
        var scopeMethods = {
            rootUrl: body.rootUrl,
            servicePath: body.servicePath,
            scopes: {}
        };
        iterateResources(body.resources);
        callback(null, scopeMethods);
        function iterateResources(resources) {
            for (var resourceKey in resources) {
                for (var methodKey in resources[resourceKey].methods) {
                    var restMethod = resources[resourceKey].methods[methodKey];
                    var id = restMethod.id;
                    var path = restMethod.path;
                    // publicScope is virtual scope
                    var scopes = 'scopes' in restMethod ? restMethod.scopes : [publicScope];
                    for (var _i = 0, scopes_1 = scopes; _i < scopes_1.length; _i++) {
                        var scope = scopes_1[_i];
                        // console.log(`    ${scope}`);
                        if (scope in scopeMethods.scopes) {
                            scopeMethods.scopes[scope].restMethods.push(restMethod);
                        }
                        else {
                            scopeMethods.scopes[scope] = {
                                description: scope === publicScope ? 'No permission required' : body.auth.oauth2.scopes[scope].description,
                                restMethods: [restMethod]
                            };
                        }
                    }
                }
                if ('resources' in resources[resourceKey]) {
                    iterateResources(resources[resourceKey].resources);
                }
            }
        }
    });
}
exports.getScopeMethods = getScopeMethods;
function getApiVersions(callback) {
    discovery.apis.list(function listCb(err, body, response) {
        if (err) {
            callback(err);
            return;
        }
        var apiVersions = [];
        var items = body.items;
        if (items.length == 0) {
            callback({ code: 404, message: 'NOT FOUND' });
        }
        else {
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                apiVersions.push({
                    name: item.name,
                    id: item.id,
                    version: item.version,
                    preferred: item.preferred
                });
            }
            callback(null, apiVersions);
        }
    });
}
exports.getApiVersions = getApiVersions;
function printScopeMethods(name, version) {
    getScopeMethods(name, version, function getScopeMethodsCb(err, scopeMethods) {
        if (err) {
            if (err.code === 404) {
                console.log("The API does not exist: " + err.code + " " + err.message);
            }
            else {
                console.log("The API returned an error: " + err.code + " " + err.message);
            }
            return;
        }
        var scopeIndex = 0;
        for (var scopeKey in scopeMethods.scopes) {
            var scope = scopeMethods.scopes[scopeKey];
            //console.log(`${scopeKey} (${scope.description})`);
            extsprintf_1.printf("[%02d] " + scopeKey + " (" + scope.description + ")\n", scopeIndex + 1);
            var keyIndex = 0;
            for (var methodKey in scope.restMethods) {
                var method = scope.restMethods[methodKey];
                // printf('%2d', keyIndex);
                extsprintf_1.printf("   (%02d) " + method.id + " (" + method.description + ")\n", keyIndex + 1);
                extsprintf_1.printf("        " + scopeMethods.rootUrl + scopeMethods.servicePath + method.path + "\n");
                keyIndex++;
            }
            scopeIndex++;
        }
    });
}
exports.printScopeMethods = printScopeMethods;
//# sourceMappingURL=index.js.map