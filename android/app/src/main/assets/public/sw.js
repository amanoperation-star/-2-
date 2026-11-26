/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-cca9a3a2'], (function (workbox) { 'use strict';

  importScripts("/sw-notifications.js");
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "sw-notifications.js",
    "revision": "d2a881de4ed574b9b75551d475c61e53"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b1a7568c10df304ba6759c8d03647be9"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6793be350df9a6838099453feccbcb73"
  }, {
    "url": "pwa-192x192.png",
    "revision": "9ba5067e233a007d8871f01544a99b1e"
  }, {
    "url": "index.html",
    "revision": "40f2e77165ce0cd1e3d6953bad523c55"
  }, {
    "url": "icon.svg",
    "revision": "b586a31147768bb55bb790502e24c09d"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "38ff4b8e6a538a73d6f6e9bb1103014e"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-DxBNXVN6.js",
    "revision": null
  }, {
    "url": "assets/web-BubXUbQG.js",
    "revision": null
  }, {
    "url": "assets/index-had1eo6T.js",
    "revision": null
  }, {
    "url": "assets/index-D1I0-i69.css",
    "revision": null
  }, {
    "url": "assets/aistudio/index_b284f89d.html",
    "revision": null
  }, {
    "url": "assets/aistudio/image_fac8e6b5.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_e02dddbe.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_c2313d4b.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_b583e401.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_8ca902f7.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_8bd62847.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_11cf6bf9.png",
    "revision": null
  }, {
    "url": "assets/aistudio/image_0004a3f1.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_2026-11-13_040423_1b445f57.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_2026-11-12_022333_5a126c92.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_2026-11-12_022317_484327ae.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "38ff4b8e6a538a73d6f6e9bb1103014e"
  }, {
    "url": "icon.svg",
    "revision": "b586a31147768bb55bb790502e24c09d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "9ba5067e233a007d8871f01544a99b1e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6793be350df9a6838099453feccbcb73"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b1a7568c10df304ba6759c8d03647be9"
  }, {
    "url": "sw-notifications.js",
    "revision": "d2a881de4ed574b9b75551d475c61e53"
  }, {
    "url": "manifest.json",
    "revision": "8620d661f51f97afa006022a8be671c9"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/\/audio\/.*\.(mp3|m4a|wav|ogg)$/i, new workbox.CacheFirst({
    "cacheName": "almawaqeet-offline-audio-v1",
    plugins: [new workbox.RangeRequestsPlugin(), new workbox.ExpirationPlugin({
      maxEntries: 350,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200, 206]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/(everyayah\.com|archive\.org|dn\d+\.ca\.archive\.org|www\.hisnmuslim\.com|ar\.assabile\.com|media\.assabile\.com|server\d+\.mp3quran\.net|www\.islamcan\.com)\/.*/i, new workbox.CacheFirst({
    "cacheName": "almawaqeet-offline-audio-v1",
    plugins: [new workbox.RangeRequestsPlugin(), new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200, 206]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
