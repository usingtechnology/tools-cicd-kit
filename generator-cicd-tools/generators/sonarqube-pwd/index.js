'use strict';
const Generator = require('../oc-generator');
const {spawnSync} = require('child_process');
const chalk = require('chalk');
const yosay = require('yosay');

const axios = require('axios');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.getAdminPassword = function (namespace) {
      const op = spawnSync(
        'oc',
        [
          '-n',
          namespace,
          '-o',
          'json',
          'get',
          'secret',
          'sonarqube-admin-password'
        ],
        {encoding: 'utf-8'}
      );
      // eslint-disable-next-line no-negated-condition
      if (op.status !== 0) {
        return false;
      }

      const secret = JSON.parse(op.stdout);
      const secretPassword = Buffer.from(secret.data.password, 'base64');
      const password = secretPassword.toString('utf-8');
      this.log(yosay(`The generated sonarqube admin password is ${chalk.green(password)}`));
      return password;
    };

    this.getUrl = function (namespace) {
      const op = spawnSync(
        'oc',
        [
          '-n',
          namespace,
          '-o',
          'json',
          'get',
          'routes',
          'sonarqube'
        ],
        {encoding: 'utf-8'}
      );
      // eslint-disable-next-line no-negated-condition
      if (op.status !== 0) {
        return false;
      }

      const route = JSON.parse(op.stdout);
      const host = route.spec.host;

      return host;
    };

    this.updatePassword = async function (url, password) {
      const changeUrl = `https://${url}/api/users/change_password?login=admin&password=${password}&previousPassword=admin`;
      await axios.post(
        changeUrl,
        {},
        {
          auth: {
            username: 'admin',
            password: 'admin'
          }
        })
        .then(response => {
          if (response.status !== 204) {
            this.env.error(
              `Encountered an error updating the sonarqube admin password. ${response.statusText}`
            );
          }
        });
    };
  }

  prompting() {
    this.answers = this.config.get('sonarqube') || {};

    const prompts = [
      {
        type: 'input',
        name: 'namespace',
        message: 'Enter the sonarqube namespace',
        default: this.answers.namespace
      }
    ];

    return this.prompt(prompts).then(answers => {
      this.answers = answers;
    });
  }

  writing() {

  }

  async install() {
    if (this.isNamespaceAdmin(this.answers.namespace)) {
      const password = this.getAdminPassword(this.answers.namespace);
      const url = this.getUrl(this.answers.namespace);
      await this.updatePassword(url, password);
    }
  }

  end() {
  }
};
