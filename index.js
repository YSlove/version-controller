'use strict';

var Promise = require('bluebird');

var fs = Promise.promisifyAll(require("fs"));
var path = require('path');

function supplant(t, o, s) {
    var regxString = s ? '{' + s + '([^{}]*)}' : '\\[([^\\[\\]]*)\\]',
        regx = new RegExp(regxString, 'g');

    return t.replace(regx, function(a, b) {
        var r0 = b.split('|'),
            r;

        for (var i = 0; i < r0.length; i++) {
            var r1 = b.split('/');
            var v = (typeof(o[r1[0]]) === 'number' ? o[r1[0]] + '' : o[r1[0]]);

            for (var j = 1; j < r1.length; j++) {

                if (typeof(v) === 'object') {
                    v = v[r1[j]];
                }
            }

            if (v) {
                r = v;
                break;
            }
        }

        if (!r) {
            r = '';
        }

        return (typeof r === "string" ? r : a);
    });
}

function VersionController(options) {
  this.options = options || {
    templateFolder: '/templ/',
    template: 'index.tpl',
    versioinFile: 'version.json',
    // parameter: {
    //   "publicPath": new Date().getTime()
    // },
    output: "index.php"
  };
}

VersionController.prototype.apply = function(compiler) {
  var self = this;

  compiler.plugin('emit', function(compilation, compileCallback){

    var com = compilation;
    var output = com.outputOptions;
    var publicPath = output.publicPath;
    var hash = com.hash;

    var templatePath = compiler.context + self.options.templateFolder;
    var templateIndex = compiler.context + self.options.templateFolder + self.options.template; 

    var versionFile = compiler.context + self.options.templateFolder + self.options.versioinFile;

    var versionObj = {};

    versionObj = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));

    versionObj['publicPath'] = publicPath;

    fs.readFileAsync(templateIndex, 'utf-8')
      .then(function(data){
          return supplant(data, versionObj, '%');
      })
      .then(function(result){
        fs.writeFileAsync(compiler.context + '/' + self.options.output, result)
          .then(function () {
            console.log('Output success!');
          });
      });

      fs.writeFileAsync(versionFile, JSON.stringify(versionObj))
        .then(function () {
          console.log('Update version success!');
        });

    compileCallback();
  })
};


module.exports = VersionController;
