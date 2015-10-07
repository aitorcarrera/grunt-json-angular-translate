/*
 * grunt-json-angular-translate
 *
 *
 * Copyright (c) 2014 Shahar Talmi
 * Licensed under the MIT license.
 */

'use strict';

var multiline = require('multiline');
var jbfunc = 'js_beautify';
var jb = require('js-beautify')[jbfunc];
var toSingleQuotes = require('to-single-quotes-shahata');
var extend = require('util')._extend;

function merge(base, add) {
  var key = Object.keys(add)[0];
  if (typeof(add[key]) === 'object' && base[key]) {
    merge(base[key], add[key]);
  } else {
    base[key] = add[key];
  }
  return base;
}


function unflatten(json) {
  return Object.keys(json).reduceRight(function(prev, key) {
    return merge(prev, key.split('.').reduceRight(function (prev, curr) {
      var obj = {};
      obj[curr] = prev;
      return obj;
    }, json[key]));
  }, {});
}

function reverse(json) {
    console.log(json);
  return Object.keys(json).reduceRight(function (newObject, value) {
    newObject[value] = json[value];
    return newObject;
  }, {});
}

function reverse_parts(json) {
    console.log(json);
    return Object.keys(json).reduceRight(function (newObject, value) {
        newObject[value] = json[value];
        return {part:newObject};
    }, {});
}

module.exports = function (grunt) {
  grunt.registerMultiTask('jsonAngularTranslate', 'The best Grunt plugin ever.', function () {
    var extractLanguage;
      var part;
    var options = this.options({
      moduleName: 'translations',
      extractLanguage: /..(?=\.[^.]*$)/,
      hasPreferredLanguage: true,
      createNestedKeys: true,
        extractPart: /i18n\/(.*)\//
    });

    if (typeof(options.extractLanguage) === 'function') {
      extractLanguage = options.extractLanguage;
    } else {
      extractLanguage = function (filepath) {
        return filepath.match(options.extractLanguage)[0];
      };
    }

    this.files.forEach(function (file) {
      // Concat specified files.
        console.log(file);
        var language,
          keys;
      var src = file.src.filter(function (filepath) {
        // Warn on and remove invalid source files (if nonull was set).
          console.log(filepath);

          if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function (filepath) {
        // Read file source.
          var currLanguage = extractLanguage(filepath);
        if (language && language !== currLanguage) {
          throw 'inconsistent language: ' + filepath + ' (' + currLanguage + ' !== ' + language + ')';
        }
        language = currLanguage;
          part = filepath.match(options.extractPart)[1];
          console.log(part)
          var processor = (options.createNestedKeys ? unflatten : reverse);
          var myObj = new Object;
           myObj[part]= JSON.parse(grunt.file.read(filepath))
        return processor(myObj);
      }).reduce(extend, {});

      src = grunt.template.process(multiline(function(){/*
'use strict';

try {
  angular.module('<%= moduleName %>');
} catch (e) {
  angular.module('<%= moduleName %>', ['pascalprecht.translate']);
}

angular.module('<%= moduleName %>').config(['$translateProvider',$translatePartialLoaderProvider, function ($translateProvider,$translatePartialLoaderProvider) {
  var translations = <%= translations %>;
       for (var key in translations) {

       $translatePartialLoaderProvider.setPart('<%= language %>',key,p[key])

       }
  if ($translateProvider.preferredLanguage) {
      $translateProvider.preferredLanguage('<%= language %>');
  }
}]).value('preferredLanguage', '<%= language %>');
      */}), {data: {language: language, moduleName: options.moduleName, translations: toSingleQuotes(JSON.stringify(src))}});

      src = jb(src, {'indent_size': 2, 'jslint_happy': true}) + '\n';

      grunt.file.write(file.dest, src);

      grunt.log.writeln('File "' + file.dest + '" created.');
    });
  });

};
