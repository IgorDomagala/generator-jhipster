/**
 * Copyright 2013-2023 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import assert from 'assert';

import BaseApplicationGenerator from '../base-application/index.mjs';
import { validations } from '../../jdl/jhipster/index.mjs';
import {
  stringifyApplicationData,
  derivedPrimaryKeyProperties,
  preparePostEntitiesCommonDerivedProperties,
  preparePostEntityCommonDerivedProperties,
} from '../base-application/support/index.mjs';
import { GENERATOR_BOOTSTRAP_APPLICATION_CLIENT, GENERATOR_BOOTSTRAP_APPLICATION_SERVER } from '../generator-list.mjs';

import { preparePostEntityServerDerivedProperties } from '../server/support/index.mjs';
import { getDefaultAppName } from '../project-name/support/index.mjs';
import { packageJson } from '../../lib/index.mjs';
import { loadStoredAppOptions } from '../app/support/index.mjs';

const {
  Validations: { MAX, MIN, MAXLENGTH, MINLENGTH, MAXBYTES, MINBYTES, PATTERN },
  SUPPORTED_VALIDATION_RULES,
} = validations;

export default class BootstrapApplicationGenerator extends BaseApplicationGenerator {
  constructor(args: any, options: any, features: any) {
    super(args, options, { jhipsterBootstrap: false, ...features });

    if (this.options.help) return;

    loadStoredAppOptions.call(this);
  }

  async beforeQueue() {
    await this.dependsOnJHipster(GENERATOR_BOOTSTRAP_APPLICATION_CLIENT);
    await this.dependsOnJHipster(GENERATOR_BOOTSTRAP_APPLICATION_SERVER);
  }

  get configuring() {
    return this.asConfiguringTaskGroup({
      defaults() {
        if (!this.options.reproducible) {
          this.config.defaults({
            jhipsterVersion: packageJson.version,
            baseName: getDefaultAppName(this),
            creationTimestamp: new Date().getTime(),
          });
        }
      },
    });
  }

  get [BaseApplicationGenerator.CONFIGURING]() {
    return this.configuring;
  }

  get preparing() {
    return this.asPreparingTaskGroup({
      preparing({ application }) {
        if (application.authenticationType === 'oauth2' || application.databaseType === 'no') {
          (application as any).skipUserManagement = true;
        }

        let prettierExtensions = 'md,json,yml,html';
        if (application.clientFrameworkAny) {
          prettierExtensions = `${prettierExtensions},cjs,mjs,js,ts,tsx,css,scss`;
          if (application.clientFrameworkVue) {
            prettierExtensions = `${prettierExtensions},vue`;
          }
          if (application.clientFrameworkSvelte) {
            prettierExtensions = `${prettierExtensions},svelte`;
          }
        }
        if (!application.skipServer) {
          prettierExtensions = `${prettierExtensions},java`;
        }
        application.prettierExtensions = prettierExtensions;
      },
    });
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.preparing;
  }

  get configuringEachEntity() {
    return this.asConfiguringEachEntityTaskGroup({
      configureFields({ entityName, entityConfig }) {
        if (entityConfig.name === undefined) {
          entityConfig.name = entityName;
        }

        entityConfig.fields.forEach((field: any) => {
          const { fieldName, fieldType, fieldValidateRules } = field;

          assert(fieldName, `fieldName is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`);
          assert(fieldType, `fieldType is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`);

          if (fieldValidateRules !== undefined) {
            assert(
              Array.isArray(fieldValidateRules),
              `fieldValidateRules is not an array in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            fieldValidateRules.forEach(fieldValidateRule => {
              assert(
                SUPPORTED_VALIDATION_RULES.includes(fieldValidateRule),
                `fieldValidateRules contains unknown validation rule ${fieldValidateRule} in .jhipster/${entityName}.json for field ${stringifyApplicationData(
                  field,
                )} [supported validation rules ${SUPPORTED_VALIDATION_RULES}]`,
              );
            });
            assert(
              !fieldValidateRules.includes(MAX) || field.fieldValidateRulesMax !== undefined,
              `fieldValidateRulesMax is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            assert(
              !fieldValidateRules.includes(MIN) || field.fieldValidateRulesMin !== undefined,
              `fieldValidateRulesMin is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            assert(
              !fieldValidateRules.includes(MAXLENGTH) || field.fieldValidateRulesMaxlength !== undefined,
              `fieldValidateRulesMaxlength is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            assert(
              !fieldValidateRules.includes(MINLENGTH) || field.fieldValidateRulesMinlength !== undefined,
              `fieldValidateRulesMinlength is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            assert(
              !fieldValidateRules.includes(MAXBYTES) || field.fieldValidateRulesMaxbytes !== undefined,
              `fieldValidateRulesMaxbytes is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            assert(
              !fieldValidateRules.includes(MINBYTES) || field.fieldValidateRulesMinbytes !== undefined,
              `fieldValidateRulesMinbytes is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
            assert(
              !fieldValidateRules.includes(PATTERN) || field.fieldValidateRulesPattern !== undefined,
              `fieldValidateRulesPattern is missing in .jhipster/${entityName}.json for field ${stringifyApplicationData(field)}`,
            );
          }
        });
      },
    });
  }

  get [BaseApplicationGenerator.CONFIGURING_EACH_ENTITY]() {
    return this.configuringEachEntity;
  }

  get preparingEachEntityRelationship() {
    return this.asPreparingEachEntityRelationshipTaskGroup({});
  }

  get [BaseApplicationGenerator.PREPARING_EACH_ENTITY_RELATIONSHIP]() {
    return this.preparingEachEntityRelationship;
  }

  get postPreparingEachEntity() {
    return this.asPostPreparingEachEntityTaskGroup({
      processEntityPrimaryKeysDerivedProperties({ entity }) {
        if (!entity.primaryKey) return;
        derivedPrimaryKeyProperties(entity.primaryKey);
      },

      prepareEntityDerivedProperties({ entity }) {
        preparePostEntityCommonDerivedProperties(entity);
        if (!entity.skipServer) {
          preparePostEntityServerDerivedProperties(entity);
        }
      },
    });
  }

  get [BaseApplicationGenerator.POST_PREPARING_EACH_ENTITY]() {
    return this.postPreparingEachEntity;
  }

  get default() {
    return this.asDefaultTaskGroup({
      postPreparingEntities({ entities }) {
        preparePostEntitiesCommonDerivedProperties(entities);
      },
    });
  }

  get [BaseApplicationGenerator.DEFAULT]() {
    return this.default;
  }
}
