'use strict'
/* ********************************
*  AlSummarization
*  An implementation for Ahmed AlSum's ECIR 2014 paper:
*   "Thumbnail Summarization Techniques for Web Archives"
*  Mat Kelly <mkelly@cs.odu.edu>
*
/**************************************
* Runs with node AlSummarization_CLI_ScreenShot.js URI-R
* using the existing code and tweeking it to the code that captures the screenshot of the URI-R passed and saves it in screenshots folder

* Maheedhar Gunnam <mgunn001@odu.edu>
*/

var http = require('http')
//var express = require('express')
var url = require('url')
var connect = require('connect')
var serveStatic = require('serve-static')
// var Step = require('step')
var async = require('async')
// var Futures = require('futures')
var Promise = require('es6-promise').Promise
var Async = require('async')
var simhash = require('simhash')('md5')
var moment = require('moment')

var ProgressBar = require('progress')
var phantom = require('node-phantom')

var fs = require('fs')
var path = require('path')
var validator = require('validator')
var underscore = require('underscore')

var webshot = require('webshot') // PhantomJS wrapper

var argv = require('minimist')(process.argv.slice(2))
var prompt = require('syncprompt')

var mementoFramework = require('./_js/mementoFramework.js')
var Memento = mementoFramework.Memento
var TimeMap = mementoFramework.TimeMap
var SimhashCacheFile = require('./_js/simhashCache.js').SimhashCacheFile

var colors = require('colors')
var im = require('imagemagick')
var rimraf = require('rimraf')

//var faye = require('faye') // For status-based notifications to client

// Faye's will not allow a URI-* as the channel name, hash it for Faye
var md5 = require('md5')

//var app = express()

var host = 'http://localhost' // Format: scheme://hostname

/* Custom ports if specified on command-line */
var thumbnailServicePort = argv.p ? argv.p : 15421
var localAssetServerPort = argv.ap ? argv.a : 1338
var notificationServerPort = argv.ap ? argv.n : 15422

/* Derived host access points */
var localAssetServer = host + ':' + localAssetServerPort + '/'
var thumbnailServer = host + ':' + thumbnailServicePort + '/'
var notificationServer = host + ':' + notificationServerPort + '/'

// Fresh system for testing (NOT IMPLEMENTED)
var nukeSystemData = argv.clean ? argv.clean : false
var uriR = ''

var HAMMING_DISTANCE_THRESHOLD = 4





/* *******************************
   TODO: reorder functions (main first) to be more maintainable 20141205
****************************** */

/**
* Start the application by initializing server instances
*/
function main () {
  console.log(('*******************************\r\n' +
               'THUMBNAIL SUMMARIZATION SERVICE\r\n' +
               '*******************************').blue)

  console.log("--By Mahee - for understanding")
  if (nukeSystemData) {
    var resp = prompt('Delete all derived data (y/N)? ')
    if (resp === 'y') {
      console.log('Deleting all dervived data.')
      nukeSystemData = false
      // TODO: figure out why the flow does not continue after the
      //       nukeSystemData conditional
      cleanSystemData(main)
      console.log('Derived data deleted.')
    } else {
      console.log('No derived data modified.')
    }
  }

  var endpoint = new CLIEndpoint()
  endpoint.headStart()
}


/**
* Setup the public-facing attributes of the service
*/
function CLIEndpoint () {
  var theEndPoint = this


  // this is method this.respondToClient, modified for CLI
  this.headStart = function () {

    var URIMFromCLI = ""


    if (process.argv.length <= 2) {
        console.log('No Argument was passed.. please pass full URI-M')
        return
    }else{
        URIMFromCLI = process.argv[2]
    }

    console.log('URI-M From CLI: ' + URIMFromCLI)

    var query = url.parse(URIMFromCLI, true).query
    console.log("--- ByMahee: Query URL from client = "+ JSON.stringify(query))

    /******************************
       IMAGE PARAMETER - allows binary image data to be returned from service
    **************************** */
    if (query.img) {
      // Return image data here
      var fileExtension = query.img.substr('-3') // Is this correct to use a string and not an int!?
      console.log('fetching ' + query.img + ' content')
      var img = fs.readFileSync(__dirname + '/' + query.img)
      console.log("200, {'Content-Type': 'image/'" + fileExtension +'}')
      return
    }

  createScreenshotForPassesURIM(URIMFromCLI)

  function createScreenshotForPassesURIM(URIMFromCLI) {
      var urim = URIMFromCLI
      var filename = 'alSum_' + urim.replace(/[^a-z0-9]/gi, '').toLowerCase() + '.png'  // Sanitize URI->filename

      try {
        fs.openSync(
          path.join(__dirname + '/screenshots/' + filename),
          'r', function (e, r) {
            console.log(e)
            console.log(r)
          })

        console.log(filename + ' already exists...continuing')
        return
      }catch (e) {
        console.log((new Date()).getTime() + ' ' + filename + ' does not exist...generating')
      }

      var options = {
        'phantomConfig': {
          'ignore-ssl-errors': true,
          'local-to-remote-url-access': true // ,
          // 'default-white-background': true,
        },
        // Remove the Wayback UI
        'onLoadFinished': function () {
          document.getElementById('wm-ipp').style.display = 'none'
        }

      }

      console.log('About to start screenshot generation process for ' + urim)
      webshot(urim, 'screenshots/' + filename, options, function (err) {
        if (err) {
          console.log('Error creating a screenshot for ' + urim)
          console.log(err)
        } else {
          fs.chmodSync('./screenshots/' + filename, '755')
          im.convert(['./screenshots/' + filename, '-thumbnail', '200',
                './screenshots/' + (filename.replace('.png', '_200.png'))],
            function (err, stdout) {
              if (err) {
                console.log('We could not downscale ./screenshots/' + filename + ' :(')
              }

              console.log('Successfully scaled ' + filename + ' to 200 pixels', stdout)
            })

          console.log('t=' + (new Date()).getTime() + ' ' + 'Screenshot created for ' + urim)
        }
      })

    }

  }
}


exports.main = main
main()
// test commit into Branch CLI_ScreenShot
