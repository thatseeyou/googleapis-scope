#!/usr/bin/env node
"use strict";
var minimist = require('minimist');
var _1 = require('./');
var extsprintf_1 = require('extsprintf');
var SortedArrayMap = require('collections/sorted-array-map');
var args = minimist(process.argv.slice(2));
//
// Usage: node build/cli.js <api> [version]
//
var isList = false;
if (args._.length < 1) {
    var isList = true;
}
var api = args._[0];
var version = args._[1];
if (isList) {
    _1.getApiVersions(function getApiVersionCb(err, apiVersions) {
        var groupByName = [];
        var apis = new SortedArrayMap();
        apis.getDefault = function (key) {
            return [];
        };
        for (var _i = 0, apiVersions_1 = apiVersions; _i < apiVersions_1.length; _i++) {
            var apiVersion = apiVersions_1[_i];
            var value = apis.get(apiVersion.name);
            var version_1 = apiVersion.preferred ? "<" + apiVersion.version + ">" : apiVersion.version;
            value.push(version_1);
            apis.set(apiVersion.name, value);
        }
        apis.forEach(function (versions, name) {
            console.log(name + " : " + versions.join(' | '));
        });
        console.log('Usage:cli.js <api> [version]');
        console.log('      cli.js drive v3');
    });
}
else if (version === undefined) {
    extsprintf_1.printf('Finding prefferd version ... ');
    _1.getApiVersions(function getApiVersionCb(err, apiVersions) {
        for (var _i = 0, apiVersions_2 = apiVersions; _i < apiVersions_2.length; _i++) {
            var apiVersion = apiVersions_2[_i];
            // console.log(`name: ${apiVersion.name}, version: ${apiVersion.version}`);
            if (apiVersion.name === api && apiVersion.preferred === true) {
                extsprintf_1.printf(apiVersion.version + "\n");
                _1.printScopeMethods(api, apiVersion.version);
            }
        }
    });
}
else {
    _1.printScopeMethods(api, version);
}
//# sourceMappingURL=cli.js.map