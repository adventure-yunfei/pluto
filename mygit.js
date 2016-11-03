/** require global package: "bluebird" */
var Promise = require('bluebird');
var child_process = require('child_process');
var nodeExecCmd = require('node-exec-cmd');

function execCmd(cmd) {
	var toLines = function(output) {
	    return !output ? [] : output.split('\n');
	};
	return nodeExecCmd(cmd)
		.then(function (output) {
			return toLines(output);
		}, function (output) {
			return Promise.reject(toLines(output));
		});
}


function checkout(branch) {
	return execCmd('git checkout ' + branch)
		.then(function (lines) {
			if (lines.some(function (line) {
				return line.indexOf('Aborting') !== -1;
			})) {
				return Promise.reject(lines);
			}
		});
}

function removeEmpty(arr) {
	return arr.filter(function (item) {
		return !!item;
	});
}

var args = process.argv.slice(2);
var act = args[0];

var actions = {
	// 获取不监听改动的文件列表
	'get-skip-worktree': function () {
		var extractSkippedFiles = function (outputLines) {
			var skippedFiles = removeEmpty(outputLines.map(function (line) {
				return line.replace(/^S/, '').trim();
			}));
			console.log(['# Skipped files:'].concat(skippedFiles.length ? skippedFiles : ['EMPTY']).join('\n  - '));
			return skippedFiles;
		};
		return execCmd('git ls-files -v | grep "^S"')
			.then(extractSkippedFiles, function (lines) {
				return lines.length ? Promise.reject(lines) : extractSkippedFiles([]);
			});
	},
	'skip-worktree': function () {
		return execCmd('git diff --name-only').then(function (lines) {
			return lines.length && execCmd('git update-index --skip-worktree ' + lines.join(' '));
		});
	},
	'no-skip-worktree': function () {
		return actions['get-skip-worktree']()
			.then(function (skippedFiles) {
				return execCmd('git update-index --no-skip-worktree ' + skippedFiles.join(' '));
			});
	},
	'pull': function () {
		function try_pull() {
			return execCmd('git pull --ff-only');
		}
		return try_pull().then(null, function () {
			return actions['no-skip-worktree']()
				.then(function () {
					return execCmd('git stash');
				}).then(try_pull)
				.then(function () {
					return execCmd('git stash pop');
				}).then(function () {
					return actions['skip-worktree']();
				});
		});
	},
	'checkout': function (branch) {
		return checkout(branch)
			.then(null, function () {
				return actions['no-skip-worktree']()
					.then(function () {
						return execCmd('git stash');
					}).then(function () {
						return checkout(branch);
					}).then(function () {
						return execCmd('git stash pop');
					}).then(function () {
						return actions['skip-worktree']();
					});
			});
	},
	'git-proxy': function () {
		return execCmd('git config http.proxy http://192.168.12.198:9999');
	}
};

var alias = {
	'gsw': 'get-skip-worktree',
	'sw': 'skip-worktree',
	'nsw': 'no-skip-worktree',
	'p': 'pull',
	'co': 'checkout'
};

if (act) {
	// 执行命令前首先跳转至GIT仓库根目录
	execCmd('git rev-parse --show-toplevel').then(function (lines) {
		process.chdir(lines.join('').trim());
		act = alias[act] || act;
		actions[act] && actions[act].apply(null, args.slice(1))
			.then(function () {
				console.log('# Result # : CMD executed successfully!');
			}, function (err) {
				console.log(err instanceof Array ? err.join('\n') : err);
			});
	});
} else {
	// 显示命令列表
	var actNameList = [];
	for (var actName in actions) {
		var displayAct = '\t  ' + actName;
		for (var actAlias in alias) {
			if (alias[actAlias] === actName) {
				displayAct = actAlias + displayAct;
				break;
			}
		}
		actNameList.push(displayAct);
	}
	console.log(['Available Command:'].concat(actNameList).join('\n  - '));
}