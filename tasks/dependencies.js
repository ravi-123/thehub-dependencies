/*
 * thehub-dependencies
 * https://github.com/cyb-ashishku/thehub-dependencies
 *
 * Copyright (c) 2015 Ashish Kumar
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');
var _ = require('lodash');

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('dependencies', 'Copy dependent folders (using contrib-copy) and then build them.', function () {
    var config = {
      copy: {}
    };
    var copyTask = 'copy_dependencies-' + this.target;
    var replaceTask = 'replace_dependencies_refrences-' + this.target;
    var copyFiles = [];
    var projects = {};

    var options = _.extend(this.options({
      projects: []
    }), this.data);

    var ignoreFolderRegex = /[\/\\](?:node_modules|dependencies|deploy|obj)[\/\\]?/;
    var ignoreFileExtRegex = /\.(?:csproj|vspscc|config)$/;

    _.each(options.projects, function (prj) {
      readDepndencies(projects, prj, this.target);
    });

    _.each(_.keys(projects), function (prj) {
      file.dest = 'build/dependencies';
      copyFiles.push({
        expand: true,
        cwd: '../../' + prj + '/deploy/',
        src: '**',
        dot: true,
        dest: path.join('dependencies/', prj),
        filter: function (filepath) {
          return !(ignoreFolderRegex.exec(filepath) || ignoreFileExtRegex.exec(filepath));
        }
      });
    });

    config.copy[copyTask] = {
      files: copyFiles
    };

    config.replace[replaceTask] = {
      src: ['deploy/**/*.ts'],
      overwrite: true,
      replacements: [{
        from: /(\/\/\/ <reference path="[.\/]*?)\/dependencies\//g,
        to: '$1/../'
      }]
    };

    grunt.log.writeln('Updated copy config');
    grunt.verbose.writeln(JSON.stringify(config, 2, 2));
    grunt.config.merge(config);

    grunt.task.run('copy:' + copyTask);
    grunt.task.run('replace:' + replaceTask);
  });

  function readDepndencies(projects, prj, target) {
    if (!projects[prj]) {
      projects[prj] = true;

      if (grunt.file.isFile('../../', prj, 'grunt', target, 'dependencies.json')) {
        var dependencies = grunt.file.readJSON(path.join('../../', prj, 'grunt', target, 'dependencies.json'));
        _.each(dependencies.projects, function (p) {
          readDepndencies(projects, p, target);
        });
      }
    }
  }
};
