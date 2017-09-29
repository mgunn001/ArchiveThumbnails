'use strict'
/* ********************************
*  AlSummarization
*  An implementation for Ahmed AlSum's ECIR 2014 paper:
*   "Thumbnail Summarization Techniques for Web Archives"
*  Mat Kelly <mkelly@cs.odu.edu>
*
/**************************************
* Runs with node AlSummarization_CLI_ScreenShot.js URI-R[optional] PixelSizeToBeReducedTo[optional]
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

var uriR = ''



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
    var pixelsFromCLI= '200'

    if (process.argv.length <= 2) {
        console.log('No Argument was passed.. please pass full URI-M')
        return
    }else{
        URIMFromCLI = process.argv[2]

        if(process.argv.length <= 3){
          console.log("using the default pixel : 200  for the reduced picture size.")
        }else{
          if(isNaN(process.argv[3])){
              console.log("Pixel argument isn't proper, using 200 By Default")
          }else{
            if (parseInt(process.argv[3]) <= 0) {
                console.log("Pixel argument isn't proper, using 200 By Default")
            }else{
              pixelsFromCLI= parseInt(process.argv[3])
            }
          }
        }
    }

    console.log('URI-M From CLI: ' + URIMFromCLI)
    console.log('To Reduce the picture to: ' + pixelsFromCLI)

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

  createScreenshotForPassesURIM(URIMFromCLI,pixelsFromCLI)

  function createScreenshotForPassesURIM(URIMFromCLI,pixelsFromCLI) {
      var urim = URIMFromCLI
      var reducedPicSize = pixelsFromCLI
      var timeWhenCaptured = (new Date()).getTime()
      var filename = 'alSum_' + urim.replace(/[^a-z0-9]/gi, '').toLowerCase() +'_'+ timeWhenCaptured + '.png'  // Sanitize URI->filename

      /* The following is the block of code, which tries to look for a file if exist doesn't dont do a screen shot
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
      } */

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
          im.convert(['./screenshots/' + filename, '-thumbnail', reducedPicSize,
                './screenshots/' + (filename.replace('.png', '_'+reducedPicSize+'.png'))],
            function (err, stdout) {
              if (err) {
                console.log('We could not downscale ./screenshots/' + filename + ' :(')
              }
              console.log('Successfully scaled ' + filename + ' to '+reducedPicSize+' pixels', stdout)
            })
            console.log('t=' + timeWhenCaptured + ' ' + 'Screenshot created for ' + urim)
        }
      })

    }

  }
}


exports.main = main
main()
// test commit into Branch CLI_ScreenShot
