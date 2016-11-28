#!/usr/bin/env node
/// <reference path='../types/collections.d.ts' />
import minimist = require('minimist');
import { printScopeMethods, getApiVersions } from './';
import { ServiceName } from 'googleapis';
import { printf } from 'extsprintf';
import SortedArrayMap = require('collections/sorted-array-map');

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
    getApiVersions(function getApiVersionCb(err, apiVersions) {
        let groupByName: Array<{name:string, versions:string[]}> = [];

        let apis = new SortedArrayMap();
        apis.getDefault = function(key) {
            return [];
        }

        for (let apiVersion of apiVersions) {
            let value = apis.get(apiVersion.name);
            let version = apiVersion.preferred ? `<${apiVersion.version}>` : apiVersion.version;
            value.push(version);
            apis.set(apiVersion.name, value);
        }

        apis.forEach(function(versions, name) {
            console.log(`${name} : ${versions.join(' | ')}`);
        });

        console.log('Usage:cli.js <api> [version]');
        console.log('      cli.js drive v3');
    });
}
else if (version === undefined) {
    printf('Finding prefferd version ... ');
    getApiVersions(function getApiVersionCb(err, apiVersions) {
        for (let apiVersion of apiVersions) {
            // console.log(`name: ${apiVersion.name}, version: ${apiVersion.version}`);
            if (apiVersion.name === api && apiVersion.preferred === true) {
                printf(`${apiVersion.version}\n`);
                printScopeMethods(api as ServiceName, apiVersion.version); 
            }
        }
    });
}
else {
    printScopeMethods(api as ServiceName, version);
}
