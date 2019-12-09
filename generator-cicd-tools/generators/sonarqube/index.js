'use strict';
const Generator = require('../oc-generator');
const {spawnSync} = require('child_process');

module.exports = class extends Generator {
  async prompting() {
    await super.prompting();

    this.answers = this.config.get('sonarqube') || {};

    const prompts = [
      {
        type: 'input',
        name: 'namespace',
        message: 'Enter the destination namespace',
        default: this.answers.namespace || this.namespaces.tools
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
      const newApp = spawnSync(
        'oc',
        [
          '-n',
          this.answers.namespace,
          'new-app',
          '-f',
          'https://raw.githubusercontent.com/BCDevOps/sonarqube/4afbbafee507081f10910e8703aada4e168849dd/sonarqube-postgresql-template.yaml'
        ],
        {encoding: 'utf-8'}
      );
      // eslint-disable-next-line no-negated-condition
      if (newApp.status !== 0) {
        if (newApp.args && newApp.args.length) {
          console.log(newApp.args.join(' '));
        }

        console.log(newApp.stdout);
        console.log(newApp.stderr);
        this.env.error(
          'Error creating the sonarqube application.'
        );
      } else {
        this.log('Deploying sonarqube application.\nOnce sonarqube is deployed run the sonarqube-pwd generator to properly secure the sonarqube admin user.');
      }
    }
  }

  end() {
    super.end();
    this.config.set('sonarqube', this.answers);
    this.config.save();
  }
};
