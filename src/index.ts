import * as google from 'googleapis';
// just for declaration
import http = require('http');
import { printf, sprintf } from 'extsprintf';

var discovery = google.discovery({
    version: 'v1',
    // params: {
    //     preferred: true
    // }
});

export interface ScopeMethods {
    rootUrl: string;
    servicePath: string;
    scopes: {
        [scope: string]: {
            description: string;
            restMethods: Array<google.discovery.RestMethod>;
        }
    }
}

export type ApiVersions = Array<{
    name: string;
    id: string;
    version: string;
    preferred: boolean;
}>;

export function getScopeMethods(name:google.ServiceName, version:string, callback:(err:any, scopeMethods?:ScopeMethods) => void):void {
    discovery.apis.getRest({api: name, version: version }, 
    function getRestCb(err:any, body:google.discovery.RestDescription, response:http.IncomingMessage) {
        if (err) {
            callback(err);
            return;
        }

        const publicScope = 'public';

        let scopeMethods: ScopeMethods = {
            rootUrl: body.rootUrl,
            servicePath: body.servicePath,
            scopes: {}
        };

        iterateResources(body.resources);

        callback(null, scopeMethods);

        function iterateResources(resources: google.discovery.RestResources) {
            for (let resourceKey in resources) {
                for (let methodKey in resources[resourceKey].methods) {
                    let restMethod = resources[resourceKey].methods[methodKey];
                    let id = restMethod.id;
                    let path = restMethod.path;

                    // publicScope is virtual scope
                    let scopes = 'scopes' in restMethod ? restMethod.scopes : [publicScope];

                    for (let scope of scopes) {
                        // console.log(`    ${scope}`);
                        if (scope in scopeMethods.scopes) {
                            scopeMethods.scopes[scope].restMethods.push(restMethod);
                        }
                        else {
                            scopeMethods.scopes[scope] = {
                                description: scope === publicScope ? 'No permission required' : body.auth.oauth2.scopes[scope].description,
                                restMethods: [restMethod]
                            }
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

export function getApiVersions(callback:(err:any, apiVersions?:ApiVersions) => void) {
    discovery.apis.list(function listCb(err:any, body:google.discovery.DirectoryList, response:http.IncomingMessage) {
        if (err) {
            callback(err);
            return;
        }

        let apiVersions:ApiVersions = [];
        let items = body.items;
        if (items.length == 0) {
            callback({code:404, message:'NOT FOUND'});
        } else {
            for(let item of items) {
                apiVersions.push({
                    name: item.name,
                    id: item.id,
                    version: item.version,
                    preferred: item.preferred
                })
            }
            callback(null, apiVersions);
        }
    });
}

export function printScopeMethods(name: google.ServiceName, version: string) {
    getScopeMethods(name, version, function getScopeMethodsCb(err: any, scopeMethods?: ScopeMethods) {
        if (err) {
            if (err.code === 404) {
                console.log(`The API does not exist: ${err.code} ${err.message}`);
            }
            else {
                console.log(`The API returned an error: ${err.code} ${err.message}`);
            }

            return;
        }

        let scopeIndex = 0;
        for (let scopeKey in scopeMethods.scopes) {
            let scope = scopeMethods.scopes[scopeKey];
            //console.log(`${scopeKey} (${scope.description})`);
            printf(`[%02d] ${scopeKey} (${scope.description})\n`, scopeIndex + 1);
            let keyIndex = 0;
            for (let methodKey in scope.restMethods) {
                let method = scope.restMethods[methodKey];
                // printf('%2d', keyIndex);
                printf(`   (%02d) ${method.id} (${method.description})\n`, keyIndex + 1);
                printf(`        ${scopeMethods.rootUrl}${scopeMethods.servicePath}${method.path}\n`);
                keyIndex++;
            }

            scopeIndex++;
        }
    });
}