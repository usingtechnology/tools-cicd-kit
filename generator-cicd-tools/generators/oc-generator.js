'use strict';
const Generator = require('yeoman-generator');

const chalk = require('chalk');
const {spawnSync} = require('child_process');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.checkLogin = function () {
      const whoAmI = spawnSync(
        'oc',
        ['whoami'],
        {encoding: 'utf-8'}
      );
      // eslint-disable-next-line no-negated-condition
      if (whoAmI.status !== 0) {
        this.env.error(
          'You are not authenticated in an OpenShift cluster.\nPlease run \'oc login ...\' command copied from the Web Console:\nhttps://console.pathfinder.gov.bc.ca:8443/console/command-line\n'
        );
        return false;
      }

      return true;
    };

    this.isNamespaceAdmin = function (namespace) {
      if (this.checkLogin()) {
        const canICreateRoleBinding = spawnSync(
          'oc',
          ['-n', namespace, 'auth', 'can-i', 'create', 'rolebinding'],
          {encoding: 'utf-8'}
        );

        if (canICreateRoleBinding.status !== 0) {
          this.env.error(
            `It seems like you do not have admin privilege in the project '${chalk.red(
              namespace
            )}'. Please check that the namespace is correct.\nTry running the following command:\n${canICreateRoleBinding.args &&
            canICreateRoleBinding.args.join(' ')}`
          );
          return false;
        }

        return true;
      }

      return false;
    };
  }

  async prompting() {
    this.namespaces = this.config.get('namespaces') || {};
    let prefix = this.namespaces.prefix || '';

    await this.prompt([
      {
        type: 'input',
        name: 'prefix',
        message: 'Enter your namespace prefix',
        default: prefix
      }
    ])
      .then(response => {
        prefix = response.prefix;
      });

    const prompts = [
      {
        type: 'input',
        name: 'tools',
        message: 'Enter your tools namespace',
        default: this.namespaces.tools || `${prefix}-tools`
      },
      {
        type: 'input',
        name: 'dev',
        message: 'Enter your dev namespace',
        default: this.namespaces.dev || `${prefix}-dev`
      },
      {
        type: 'input',
        name: 'test',
        message: 'Enter your test namespace',
        default: this.namespaces.test || `${prefix}-test`
      },
      {
        type: 'input',
        name: 'prod',
        message: 'Enter your prod namespace',
        default: this.namespaces.prod || `${prefix}-prod`
      }
    ];

    return this.prompt(prompts).then(answers => {
      // To access props later use this.props.someAnswer;
      this.namespaces = {...answers, prefix};
    });
  }

  end() {
    if (this.namespaces) {
      this.config.set('namespaces', this.namespaces);
      this.config.save();
    }
  }
};
