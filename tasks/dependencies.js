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
      copy: {},
      replace: {}
    };
    var target = this.target || 'dev';
    var copyTask = 'copy_dependencies-' + target;
    var replaceTask = 'replace_dependencies_refrences-' + target;
    var copyFiles = [];
    var projects = {};

    var options = _.extend(this.options({
      projects: []
    }), this.data);

    _.each(options.projects, function (prj) {
      readDepndencies(projects, prj, target);
    });

    _.each(projects, function (prj) {
      copyFiles.push({
        expand: true,
        cwd: projectDeployPath(prj),
        src: '**',
        dot: true,
        dest: path.join('dependencies/', prj.solution, prj.project)
      });
    });

    config.copy[copyTask] = {
      files: copyFiles
    };

    config.replace[replaceTask] = {
      src: ['dependencies/**/*.ts'],
      overwrite: true,
      replacements: [{
        from: /(\/\/\/ <reference path="[.\/]*?)\/dependencies\//g,
        to: '$1/'
      }]
    };

    grunt.log.writeln('Updated copy config');
    grunt.verbose.writeln(JSON.stringify(config, 2, 2));
    grunt.config.merge(config);

    grunt.task.run('copy:' + copyTask);
    grunt.task.run('replace:' + replaceTask);
  });

  function readDepndencies(projects, prj, target) {
    var prjKey = projectKey(projects, prj);
    if (!projects[prjKey]) {
      projects[prjKey] = prj;

      var depndsPath = projectDependenciesPath(prj, target);
      if (grunt.file.isFile(depndsPath)) {
        var dependencies = grunt.file.readJSON(depndsPath);
        _.each(dependencies.projects, function (p) {
          readDepndencies(projects, p, target);
        });
      }
    }
  }

  function projectDeployPath(prj) {
      var parentLevel = prj.for === 'core' ? path.join('..', '..') : path.join('..', '..', '..');
      return path.join(parentLevel, prj.solution, prj.project, 'deploy', prj.project);
  }
  function projectDependenciesPath(prj, target, parentLevel) {
      var parentLevel = prj.for === 'core' ? path.join('..', '..') : path.join('..', '..', '..');
      return path.join(parentLevel, prj.solution, prj.project, 'grunt', target, 'dependencies.json');
  }
  function projectKey(projects, prj) {
    return  prj.solution + '/' + prj.project;
  }
};
