'use strict';
const Generator = require('../oc-generator');
const {spawnSync} = require('child_process');

module.exports = class extends Generator {

  async prompting() {
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

  install() {
    if (this.isNamespaceAdmin(this.answers.namespace)) {
      this.log('Deleting sonarqube server, database, and related objects...');
      const delAll = spawnSync(
        'oc',
        [
          '-n',
          this.answers.namespace,
          'delete',
          'all,template,secret,cm,pvc,sa,rolebinding',
          '--selector',
          'app=sonarqube'
        ],
        {encoding: 'utf-8'}
      );
      // eslint-disable-next-line no-negated-condition
      if (delAll.status !== 0) {
        if (delAll.args && delAll.args.length) {
          console.log(delAll.args.join(' '));
        }

        console.log(delAll.stdout);
        console.log(delAll.stderr);
        this.env.error(
          'Error deleting the sonarqube server, database, and related objects.'
        );
      } else {
        this.log('Deleting sonarqube admin secret...');
        const delSecret = spawnSync(
          'oc',
          [
            '-n',
            this.answers.namespace,
            'delete',
            'secret',
            'sonarqube-admin-password'
          ],
          {encoding: 'utf-8'}
        );
        // eslint-disable-next-line no-negated-condition
        if (delSecret.status !== 0) {
          if (delSecret.args && delSecret.args.length) {
            console.log(delSecret.args.join(' '));
          }

          console.log(delSecret.stdout);
          console.log(delSecret.stderr);
          this.env.error(
            'Error deleting the sonarqube admin secret.'
          );
        }
      }
    }
  }

  end() {
  }
};
